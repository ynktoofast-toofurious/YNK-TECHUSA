/**
 * YNK Tech Admin: private approve/reject console + public intake endpoint.
 *
 * Console (private): Deploy > Test deployments > Web app URL (ends in /dev). Only project editors can open it,
 *   behind your Google sign-in and 2-Step Verification. Every server call re-checks the signed-in user.
 * Intake (public): Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone.
 *   The website POSTs { action: 'request' | 'verify' } to its /exec URL. No admin data is ever returned.
 *
 * One-time: run setupAdmin() to create the Access_Requests tab and authorize email sending.
 * Optional Script Property ADMIN_EMAILS (comma separated) adds admins besides the script owner.
 */

const ADMIN = {
  requestsTab: 'Access_Requests',
  topicsTab: 'Topic_Requests',
  driveRootIds: ['1Mm3XNSGGezqVRByJ5fqj7OH4ZePvh6bp', '181eZXt5MNOKN_5bDTVANp6dXCi1516Wk'],
  codeDays: 7,
  siteUrl: 'https://ynk-techusa.com',
  industries: ['Healthcare', 'Finance', 'Education', 'Technology', 'Government', 'Retail', 'Data Engineering'],
}

const REQ_HEADERS = ['request_id', 'submitted_at', 'name', 'email', 'company', 'industry', 'reason', 'status',
  'decided_at', 'decided_by', 'decision_note', 'code_hash', 'code_expires_at']
const REQ = { pending: 'PENDING', approved: 'APPROVED', rejected: 'REJECTED', revoked: 'REVOKED' }
const TOPIC_HEADERS = ['request_id', 'submitted_at', 'topics', 'custom_topic', 'audience', 'email', 'language', 'status']
const TOPIC_STATUS = ['NEW', 'PLANNED', 'ARCHIVED']
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/* ---------------- Web entry points ---------------- */

function doGet() {
  if (!isAdmin_()) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif;padding:24px">Not available.</p>').setTitle('YNK Tech')
  }
  return HtmlService.createHtmlOutputFromFile('Console')
    .setTitle('YNK Tech Admin')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
}

function doPost(e) {
  let body
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}')
  } catch (err) {
    return json_({ ok: false, error: 'bad_request' })
  }
  try {
    if (body.action === 'request') return json_(intakeRequest_(body))
    if (body.action === 'verify') return json_(verifyCode_(body))
    if (body.action === 'topic') return json_(intakeTopic_(body))
    return json_({ ok: false, error: 'unknown_action' })
  } catch (err) {
    console.error(err)
    return json_({ ok: false, error: 'server_error' })
  }
}

function setupAdmin() {
  requestsSheet_()
  topicsSheet_()
  MailApp.getRemainingDailyQuota()
  Logger.log('Access_Requests and Topic_Requests tabs ready. Console admin: %s', Session.getEffectiveUser().getEmail())
  Logger.log('Drive scan: %s', JSON.stringify(discoverDrive_(true)))
}

/* ---------------- Console API (google.script.run) ---------------- */

function adminLoad() {
  assertAdmin_()
  const ss = SpreadsheetApp.openById(CONFIG.queueSheetId)
  return {
    user: Session.getActiveUser().getEmail(),
    sheetUrl: ss.getUrl(),
    drive: null,
    articles: listArticles_(),
    requests: readRequests_().map(publicRequest_),
    topics: topicsView_(),
  }
}

// Runs after the list is on screen so a slow Drive never blocks the console.
function adminScanDrive(force) {
  assertAdmin_()
  const lock = LockService.getScriptLock()
  if (!lock.tryLock(30000)) return { drive: { added: [], incomplete: [], upgraded: [], error: '' }, articles: listArticles_() }
  let drive
  try {
    drive = discoverDrive_(Boolean(force))
  } catch (e) {
    drive = { added: [], incomplete: [], upgraded: [], error: String(e.message || e) }
  } finally {
    lock.releaseLock()
  }
  return { drive, articles: listArticles_() }
}

function adminSetTopicStatus(requestId, status) {
  assertAdmin_()
  if (TOPIC_STATUS.indexOf(status) < 0) throw new Error('Unknown status.')
  const sheet = topicsSheet_()
  const ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues().map((r) => str_(r[0]))
  const idx = ids.indexOf(str_(requestId))
  if (idx < 0) throw new Error('Topic request not found.')
  sheet.getRange(idx + 2, TOPIC_HEADERS.indexOf('status') + 1).setValue(status)
  return topicsView_()
}

function adminApproveArticle(articleId) {
  assertAdmin_()
  let { queue, row } = findArticle_(articleId)
  if (str_(row.get('syncState')).toUpperCase() !== SYNC.prOpen) {
    REVIEWS.forEach(([key]) => {
      if (!PASSED_RE.test(str_(row.get(key)))) queue.set(row, key, pickOption_(queue.options(row, key), PASSED_RE, 'PASS'))
    })
    queue.set(row, 'approval', APPROVED)
    queue.set(row, 'syncState', SYNC.blocked)
    // An explicit approval always sends, even if the content matches a previously closed PR.
    queue.set(row, 'syncHash', '')
    queue.set(row, 'error', '')
    SpreadsheetApp.flush()
    syncApprovedArticles()
    ;({ queue, row } = findArticle_(articleId))
  }
  if (str_(row.get('syncState')).toUpperCase() !== SYNC.prOpen) {
    throw new Error(str_(row.get('error')) || 'Could not prepare the article. Please try again in a minute.')
  }
  mergeArticlePr_(queue, row)
  return articleById_(articleId)
}

function adminPreview(articleId) {
  assertAdmin_()
  const { row } = findArticle_(articleId)
  const assetsTable = openTable_(CONFIG.registrySheetId, CONFIG.assetsTab, ASSET_COLS, 'assetId', [])
  const linksTable = openTable_(CONFIG.registrySheetId, CONFIG.articleImagesTab, ARTICLE_IMAGE_COLS, 'articleId', [])
  const assets = {}
  assetsTable.rows.forEach((r) => { assets[str_(r.get('assetId'))] = r })
  const built = buildArticle_(row, assets, linksTable.rows, { lenientImage: true })
  let hero = null
  if (built.hero) {
    const a = built.hero.asset
    hero = {
      src: built.hero.image ? `data:${a.file.endsWith('.png') ? 'image/png' : a.file.endsWith('.webp') ? 'image/webp' : 'image/jpeg'};base64,${Utilities.base64Encode(built.hero.image.bytes)}` : '',
      alt: a.alt,
      caption: a.caption || null,
      credit: a.credit || '',
      sourceUrl: a.source_url || '',
    }
  }
  const images = {}
  Object.keys(built.images || {}).forEach((path) => {
    const img = built.images[path]
    const mime = img.ext === 'png' ? 'image/png' : img.ext === 'webp' ? 'image/webp' : 'image/jpeg'
    images[path] = `data:${mime};base64,${Utilities.base64Encode(img.bytes)}`
  })
  const sources = LANGS.map(([lang, col]) => {
    const id = driveId_(row.get(col))
    const info = id && fileInfo_(id)
    return info ? { lang, name: info.name, html: info.html, url: `https://drive.google.com/open?id=${id}` } : { lang, missing: true }
  })
  return { id: built.articleId, type: built.meta.type, date: built.meta.date, editions: built.editions, hero, images, sources,
    imageError: [built.imageError].concat(built.warnings || []).filter(Boolean).join(' '), fixes: built.fixes }
}

function mergeArticlePr_(queue, row) {
  const m = str_(row.get('prUrl')).match(/\/pull\/(\d+)/)
  if (!m) throw new Error('Nothing to publish yet.')
  const token = getToken_()
  let lastError = null
  // GitHub needs a moment to compute mergeability for a brand-new pull request.
  for (let attempt = 0; attempt < 4; attempt++) {
    const pr = gh_(token, 'GET', `/pulls/${m[1]}`)
    if (pr.merged_at) break
    if (pr.state !== 'open') throw new Error('This version was withdrawn. Approve again to send a fresh copy.')
    try {
      gh_(token, 'PUT', `/pulls/${m[1]}/merge`, { merge_method: 'squash' })
      lastError = null
      break
    } catch (e) {
      lastError = e
      Utilities.sleep(2500)
    }
  }
  if (lastError) throw new Error(`Publishing did not complete: ${lastError.message}`)
  queue.set(row, 'syncState', SYNC.published)
  queue.set(row, 'error', '')
}

function adminRejectArticle(articleId, note) {
  assertAdmin_()
  const { queue, row } = findArticle_(articleId)
  const m = str_(row.get('prUrl')).match(/\/pull\/(\d+)/)
  if (m && str_(row.get('syncState')).toUpperCase() === SYNC.prOpen) {
    gh_(getToken_(), 'PATCH', `/pulls/${m[1]}`, { state: 'closed' })
  }
  queue.set(row, 'approval', pickOption_(queue.options(row, 'approval'), /reject/i, 'DRAFT'))
  if (str_(row.get('syncState')).toUpperCase() !== SYNC.published) queue.set(row, 'syncState', SYNC.blocked)
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  const reason = cleanInput_(note, 500)
  queue.set(row, 'error', `Backlog ${stamp}${reason ? `: ${reason}` : ''}`)
  if (queue.map.notes != null) {
    const prev = str_(row.get('notes'))
    queue.set(row, 'notes', safeCell_(`${prev ? `${prev}\n` : ''}Backlog ${stamp}${reason ? `: ${reason}` : ''}`))
  }
  return articleById_(articleId)
}

function adminApproveUser(requestId) {
  assertAdmin_()
  const { sheet, req } = findRequest_(requestId)
  if (req.status !== REQ.pending && req.status !== REQ.rejected) throw new Error(`Request is already ${req.status.toLowerCase()}.`)
  const code = generateCode_()
  const expires = new Date(Date.now() + ADMIN.codeDays * 864e5)
  writeRequest_(sheet, req.rowNumber, {
    status: REQ.approved,
    decided_at: new Date(),
    decided_by: Session.getActiveUser().getEmail(),
    code_hash: sha256_(normalizeCode_(code)),
    code_expires_at: expires,
  })
  sendMail_(req.email, 'Your YNK Tech access code', [
    `<p>Hello ${esc_(req.name)},</p>`,
    `<p>Your request for the <strong>${esc_(req.industry)}</strong> section has been approved.</p>`,
    `<p style="font-size:20px;font-weight:700;letter-spacing:2px;font-family:monospace">${code}</p>`,
    `<p>Enter it at <a href="${ADMIN.siteUrl}/consultants">${ADMIN.siteUrl}/consultants</a>. It is valid until ${fmtDate_(expires)}.</p>`,
    '<p>YNK Tech USA</p>',
  ].join(''))
  return { request: publicRequest_(Object.assign(req, { status: REQ.approved, code_expires_at: expires })), code }
}

function adminRejectUser(requestId, note, notify) {
  assertAdmin_()
  const { sheet, req } = findRequest_(requestId)
  const reason = cleanInput_(note, 500)
  writeRequest_(sheet, req.rowNumber, {
    status: REQ.rejected,
    decided_at: new Date(),
    decided_by: Session.getActiveUser().getEmail(),
    decision_note: reason,
    code_hash: '',
    code_expires_at: '',
  })
  if (notify) {
    sendMail_(req.email, 'Your YNK Tech access request', [
      `<p>Hello ${esc_(req.name)},</p>`,
      `<p>Thank you for your interest. We are not able to approve your request for the <strong>${esc_(req.industry)}</strong> section at this time.</p>`,
      reason ? `<p>${esc_(reason)}</p>` : '',
      `<p>You are welcome to <a href="${ADMIN.siteUrl}/start-project">start a project brief</a> and we will follow up directly.</p>`,
      '<p>YNK Tech USA</p>',
    ].join(''))
  }
  return publicRequest_(Object.assign(req, { status: REQ.rejected, decision_note: reason }))
}

function adminRevokeUser(requestId) {
  assertAdmin_()
  const { sheet, req } = findRequest_(requestId)
  writeRequest_(sheet, req.rowNumber, {
    status: REQ.revoked,
    decided_at: new Date(),
    decided_by: Session.getActiveUser().getEmail(),
    code_hash: '',
    code_expires_at: '',
  })
  return publicRequest_(Object.assign(req, { status: REQ.revoked, code_expires_at: '' }))
}

/* ---------------- Public intake ---------------- */

function intakeRequest_(b) {
  // Honeypot field filled in: pretend success so bots learn nothing.
  if (str_(b.website)) return { ok: true }
  const name = cleanInput_(b.name, 100)
  const email = cleanInput_(b.email, 200).toLowerCase()
  const company = cleanInput_(b.company, 120) || 'N/A'
  const industry = cleanInput_(b.industry, 40)
  const reason = cleanInput_(b.reason, 1000)
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || ADMIN.industries.indexOf(industry) < 0 || reason.length < 5) {
    return { ok: false, error: 'invalid' }
  }
  if (!rateLimit_('rq:all', 40, 3600) || !rateLimit_(`rq:${sha256_(email).slice(0, 20)}`, 3, 3600)) {
    return { ok: false, error: 'rate_limited' }
  }

  const id = `REQ-${Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd')}-${Utilities.getUuid().slice(0, 6).toUpperCase()}`
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    requestsSheet_().appendRow([id, new Date(), name, email, company, industry, reason, REQ.pending, '', '', '', '', ''].map(safeCell_))
  } finally {
    lock.releaseLock()
  }

  sendMail_(Session.getEffectiveUser().getEmail(), `New access request: ${name} (${industry})`, [
    '<p>A new access request is waiting in the YNK Tech Admin console.</p>',
    `<p><strong>${esc_(name)}</strong> &lt;${esc_(email)}&gt;<br>${esc_(company)} &middot; ${esc_(industry)}</p>`,
    `<p>${esc_(reason)}</p>`,
  ].join(''))
  return { ok: true }
}

function verifyCode_(b) {
  if (!rateLimit_('vf:all', 60, 600)) return { ok: false, error: 'rate_limited' }
  const code = normalizeCode_(b.code)
  if (code.length < 6 || code.length > 40) return { ok: true, valid: false }
  const hash = sha256_(code)
  const now = Date.now()
  const hit = readRequests_().find((r) => r.status === REQ.approved && r.code_hash === hash &&
    (!r.code_expires_at || new Date(r.code_expires_at).getTime() > now))
  return hit ? { ok: true, valid: true, industry: hit.industry } : { ok: true, valid: false }
}

/* ---------------- Articles ---------------- */

function listArticles_() {
  const queue = openTable_(CONFIG.queueSheetId, CONFIG.queueTab, QUEUE_COLS, 'articleId', [])
  return queue.rows.map((row) => articleView_(queue, row))
}

function articleById_(articleId) {
  const { queue, row } = findArticle_(articleId)
  return articleView_(queue, row)
}

function findArticle_(articleId) {
  const queue = openTable_(CONFIG.queueSheetId, CONFIG.queueTab, QUEUE_COLS, 'articleId', ['syncState', 'prUrl', 'syncHash', 'error'])
  const row = queue.rows.find((r) => str_(r.get('articleId')) === str_(articleId))
  if (!row) throw new Error(`Article ${articleId} was not found in the Editorial Queue.`)
  return { queue, row }
}

function articleView_(queue, row) {
  const approval = str_(row.get('approval')).toUpperCase()
  const sync = str_(row.get('syncState')).toUpperCase()
  const slug = str_(row.get('slug'))
  let stage = 'review'
  if (sync === SYNC.published) stage = 'published'
  else if (sync !== SYNC.prOpen && (/REJECT/.test(approval) || /^(Rejected|Backlog) /.test(str_(row.get('error'))))) stage = 'rejected'
  const rawType = str_(row.get('type')).toLowerCase()
  const docs = {}
  LANGS.forEach(([lang, col]) => {
    const id = driveId_(row.get(col))
    if (id) docs[lang] = `https://drive.google.com/open?id=${id}`
  })
  return {
    id: str_(row.get('articleId')),
    title: str_(row.get('titleEn')) || slug,
    type: rawType === 'study' ? 'Study' : 'Article',
    date: dayOf_(row.get('date')) || fmtDate_(row.get('date')),
    stage,
    approval,
    syncState: sync,
    reviews: REVIEWS.map(([key, name]) => ({ name: name.replace(/_review$/, '').replace(/_/g, ' '), value: str_(row.get(key)), passed: PASSED_RE.test(str_(row.get(key))) })),
    docs,
    prUrl: str_(row.get('prUrl')),
    liveUrl: stage === 'published' && slug ? `${ADMIN.siteUrl}/latest/${slug}` : '',
    error: str_(row.get('error')),
  }
}

/* ---------------- Drive discovery ---------------- */

// Pairs EN/FR/ES sources by "title - date" (across en/fr/es folders or within one folder),
// switches unpublished queue rows from Google Docs to matching HTML files,
// and adds new complete sets to the Editorial Queue as DRAFT rows.
function discoverDrive_(force) {
  const queue = openTable_(CONFIG.queueSheetId, CONFIG.queueTab, QUEUE_COLS, 'articleId', ['syncState', 'prUrl', 'syncHash', 'error', 'type'])
  const { docs, errors } = scanDrive_(force)
  const byId = {}
  docs.forEach((d) => { byId[d.id] = d })
  const info = (id) => (id in byId ? byId[id] : (byId[id] = fileInfo_(id)))

  const knownSlugs = {}
  const entries = queue.rows.map((row) => {
    knownSlugs[str_(row.get('slug'))] = true
    const ids = {}
    LANGS.forEach(([, col]) => { ids[col] = driveId_(row.get(col)) })
    return { row, ids, published: str_(row.get('syncState')).toUpperCase() === SYNC.published }
  })
  const claimed = () => {
    const out = {}
    entries.forEach((e) => LANGS.forEach(([, col]) => { if (e.ids[col]) out[e.ids[col]] = true }))
    return out
  }
  const upgradedRows = new Map()
  const retired = {}
  const useFile = (e, col, file) => {
    if (e.ids[col] === file.id) return
    if (e.ids[col]) retired[e.ids[col]] = true
    queue.set(e.row, col, file.id)
    e.ids[col] = file.id
    upgradedRows.set(e, true)
  }

  // Rows still pointing at Google Docs (published ones too) pick up the HTML file with the same title and date in that language.
  const used = claimed()
  entries.forEach((e) => {
    const keys = [normKey_(e.row.get('titleEn')), normKey_(e.row.get('slug'))]
    LANGS.forEach(([, col]) => {
      const id = e.ids[col]
      if (!id) return
      const d = info(id)
      if (d) keys.push(d.key)
    })
    const rowDate = dayOf_(e.row.get('date'))
    LANGS.forEach(([lang, col]) => {
      const cur = e.ids[col] && info(e.ids[col])
      if (cur && cur.html) return
      const hit = docs
        .filter((d) => d.html && d.lang === lang && !used[d.id] && keys.some((k) => sameKey_(k, d.key)) && closeDays_(d.date, rowDate))
        .sort((a, b) => b.updated - a.updated)[0]
      if (hit) { useFile(e, col, hit); used[hit.id] = true }
    })
  })

  const groups = {}
  docs.forEach((d) => {
    if (!d.lang) return
    const key = `${d.series.join('/')}::${d.parts.base.toLowerCase()}`
    const g = groups[key] || (groups[key] = { series: d.series, title: d.parts.title, date: d.parts.date, docs: {}, all: [] })
    g.all.push(d)
    // HTML wins over a Google Doc for the same language.
    if (!g.docs[d.lang] || (d.html && !g.docs[d.lang].html)) g.docs[d.lang] = d
  })

  const sheet = SpreadsheetApp.openById(CONFIG.queueSheetId).getSheetByName(CONFIG.queueTab)
  const width = sheet.getLastColumn()
  const draft = queue.rows.length ? pickOption_(queue.options(queue.rows[0], 'approval'), /draft/i, 'DRAFT') : 'DRAFT'
  const added = []
  const incomplete = []

  Object.keys(groups).forEach((key) => {
    const g = groups[key]
    const known = entries.find((e) => g.all.some((d) => LANGS.some(([, col]) => e.ids[col] === d.id)))
    if (known) {
      if (!known.row) return
      LANGS.forEach(([lang, col]) => {
        const d = g.docs[lang]
        if (d && d.html) useFile(known, col, d)
      })
      return
    }
    const knownDocs = claimed()
    if (Object.keys(g.docs).some((l) => knownDocs[g.docs[l].id] || retired[g.docs[l].id])) return
    const missing = ['en', 'fr', 'es'].filter((l) => !g.docs[l])
    const label = `${g.title}${g.date ? ` (${Utilities.formatDate(g.date, 'UTC', 'yyyy-MM-dd')})` : ''}`
    if (missing.length) {
      incomplete.push({ name: label, missing: missing.map((l) => l.toUpperCase()) })
      return
    }
    const date = g.date || new Date(g.docs.en.created)
    let slug = slugify_(g.title) || `piece-${g.docs.en.id.slice(-6).toLowerCase()}`
    if (knownSlugs[slug]) slug = `${slug}-${Utilities.formatDate(date, 'UTC', 'yyyy-MM-dd')}`.slice(0, 80)
    knownSlugs[slug] = true
    const isStudy = /stud|[e\u00e9]tude|estudio/i.test(g.series.join(' '))
    const articleId = `YNK-${Utilities.formatDate(date, 'UTC', 'yyyyMMdd')}-${g.docs.en.id.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}`

    const values = new Array(width).fill('')
    const put = (k, v) => { if (queue.map[k] != null) values[queue.map[k]] = typeof v === 'string' ? safeCell_(v) : v }
    put('articleId', articleId)
    put('date', date)
    put('slug', slug)
    put('titleEn', g.title)
    put('docEn', g.docs.en.id)
    put('docFr', g.docs.fr.id)
    put('docEs', g.docs.es.id)
    put('approval', draft)
    put('syncState', SYNC.blocked)
    put('type', isStudy ? 'study' : 'analysis')
    sheet.appendRow(values)
    // Just added: nothing to upgrade.
    entries.push({ row: null, ids: { docEn: g.docs.en.id, docFr: g.docs.fr.id, docEs: g.docs.es.id }, published: true })
    added.push({ id: articleId, title: g.title })
  })

  const upgraded = []
  upgradedRows.forEach((_, e) => {
    resetForNewSource_(queue, e.row)
    upgraded.push({ id: str_(e.row.get('articleId')), title: str_(e.row.get('titleEn')) || str_(e.row.get('slug')) })
  })
  return { added, incomplete, upgraded, error: errors.join(' ') }
}

const SCAN_CACHE_KEY = 'drive-scan-v1'
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files'

// File listing is cached for 10 minutes; Refresh in the console forces a fresh scan.
function scanDrive_(force) {
  const cache = CacheService.getScriptCache()
  let raw = null
  if (!force) {
    const hit = cache.get(SCAN_CACHE_KEY)
    if (hit) raw = JSON.parse(hit)
  }
  if (!raw) {
    try {
      raw = listTreeApi_()
    } catch (e) {
      console.warn(`Drive API listing failed, falling back to DriveApp: ${e.message || e}`)
      raw = listTreeDriveApp_()
    }
    try { cache.put(SCAN_CACHE_KEY, JSON.stringify(raw), 600) } catch (e) { console.warn('Scan too large to cache.') }
  }
  const docs = raw.files.map((f) => {
    const folderLang = langOfFolder_(f.path[f.path.length - 1])
    const parts = splitName_(f.name.replace(/\.html?$/i, ''))
    return Object.assign({}, f, {
      parts,
      lang: folderLang || parts.lang,
      series: folderLang ? f.path.slice(0, -1) : f.path,
      key: normKey_(parts.title),
      date: parts.date ? Utilities.formatDate(parts.date, Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
    })
  })
  return { docs, errors: raw.errors }
}

// Lists the folder trees level by level, all folders of a level in parallel.
function listTreeApi_() {
  const headers = { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` }
  const files = []
  const errors = []
  const seenFolders = {}
  const seenFiles = {}
  let level = []
  UrlFetchApp.fetchAll(ADMIN.driveRootIds.map((id) => ({
    url: `${DRIVE_API}/${id}?fields=id,name&supportsAllDrives=true`, headers, muteHttpExceptions: true,
  }))).forEach((res, i) => {
    const code = res.getResponseCode()
    if (code === 200) {
      const f = JSON.parse(res.getContentText())
      if (!seenFolders[f.id]) { seenFolders[f.id] = true; level.push({ id: f.id, path: [f.name] }) }
    } else if (code === 404) {
      errors.push(`Drive folder ${ADMIN.driveRootIds[i]} could not be opened with this Google account.`)
    } else {
      throw new Error(`Drive API ${code}: ${res.getContentText().slice(0, 200)}`)
    }
  })

  for (let depth = 0; level.length && depth <= 5; depth++) {
    const next = []
    let pending = level.map((folder) => ({ folder, pageToken: '' }))
    while (pending.length) {
      const batch = pending.slice(0, 40)
      pending = pending.slice(40)
      UrlFetchApp.fetchAll(batch.map((p) => ({ url: `${DRIVE_API}?${query_({
        q: `'${p.folder.id}' in parents and trashed = false`,
        fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,createdTime)',
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageToken: p.pageToken,
      })}`, headers, muteHttpExceptions: true }))).forEach((res, i) => {
        const p = batch[i]
        if (res.getResponseCode() !== 200) throw new Error(`Drive API ${res.getResponseCode()}: ${res.getContentText().slice(0, 200)}`)
        const body = JSON.parse(res.getContentText())
        ;(body.files || []).forEach((f) => {
          if (f.mimeType === 'application/vnd.google-apps.folder') {
            if (depth < 5 && !seenFolders[f.id]) { seenFolders[f.id] = true; next.push({ id: f.id, path: p.folder.path.concat(f.name) }) }
            return
          }
          const html = /html/i.test(f.mimeType) || /\.html?$/i.test(f.name)
          if ((html || f.mimeType === MimeType.GOOGLE_DOCS) && !seenFiles[f.id]) {
            seenFiles[f.id] = true
            files.push({ id: f.id, name: f.name, html, updated: Date.parse(f.modifiedTime), created: Date.parse(f.createdTime), path: p.folder.path })
          }
        })
        if (body.nextPageToken) pending.push({ folder: p.folder, pageToken: body.nextPageToken })
      })
    }
    level = next
  }
  return { files, errors }
}

function listTreeDriveApp_() {
  const files = []
  const errors = []
  const seen = {}
  ADMIN.driveRootIds.forEach((rootId) => {
    const found = []
    try {
      collectDocs_(DriveApp.getFolderById(rootId), [], 0, found)
    } catch (e) {
      errors.push(`Drive folder ${rootId} could not be opened (${e.message || e}).`)
      return
    }
    found.forEach((d) => {
      const id = d.file.getId()
      if (seen[id]) return
      seen[id] = true
      files.push({ id, name: d.file.getName(), html: d.html, updated: d.file.getLastUpdated().getTime(), created: d.file.getDateCreated().getTime(), path: d.path })
    })
  })
  return { files, errors }
}

function query_(params) {
  return Object.keys(params).filter((k) => params[k] !== '' && params[k] != null)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')
}

// Source file outside the scanned folders: name-based key and format only.
function fileInfo_(id) {
  try {
    const file = DriveApp.getFileById(id)
    const parts = splitName_(file.getName().replace(/\.html?$/i, ''))
    return { id, name: file.getName(), html: isHtmlFile_(file), key: normKey_(parts.title) }
  } catch (e) {
    return null
  }
}

// "Congo Forest Intelligence - TEST" and "congo-forest-intelligence-2026-11-13" -> "congo forest intelligence"
function normKey_(text) {
  return str_(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\.html?$/, '')
    .replace(/\d{4}[-_. ]\d{2}[-_. ]\d{2}/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(test|draft|final|copy|copie|copia|html)\b/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

function sameKey_(a, b) {
  if (!a || !b) return false
  if (a === b) return true
  return Math.min(a.length, b.length) >= 12 && (a.indexOf(b) >= 0 || b.indexOf(a) >= 0)
}

function dayOf_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, sheetTz_(), 'yyyy-MM-dd')
  const m = str_(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : ''
}

// One day of slack absorbs file names dated in another time zone.
function closeDays_(a, b) {
  if (!a || !b) return true
  return Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) <= 86400000
}

// A new source makes any open pull request stale: close it so the next approval sends the new version.
// A published item goes back to review; the live page keeps the old version until it is approved again.
function resetForNewSource_(queue, row) {
  const sync = str_(row.get('syncState')).toUpperCase()
  if (sync === SYNC.published) {
    queue.set(row, 'approval', pickOption_(queue.options(row, 'approval'), /draft/i, 'DRAFT'))
    queue.set(row, 'error', 'Live on the site with the previous version. Approve to publish the HTML version.')
  }
  const m = str_(row.get('prUrl')).match(/\/pull\/(\d+)/)
  if (sync === SYNC.prOpen && m) {
    try { gh_(getToken_(), 'PATCH', `/pulls/${m[1]}`, { state: 'closed' }) } catch (e) { console.warn(e) }
  }
  queue.set(row, 'syncState', SYNC.blocked)
  queue.set(row, 'syncHash', '')
}

/* ---------------- Source files (console) ---------------- */

function adminHtmlOptions(articleId, lang) {
  assertAdmin_()
  if (!LANGS.some(([l]) => l === lang)) throw new Error('Unknown language.')
  const { row } = findArticle_(articleId)
  const keys = [normKey_(row.get('titleEn')), normKey_(row.get('slug'))]
  const { docs } = scanDrive_(false)
  return docs
    .filter((d) => d.html && (d.lang === lang || !d.lang))
    .map((d) => ({ id: d.id, name: d.name, path: d.path.join(' / '), match: keys.some((k) => sameKey_(k, d.key)), t: d.updated }))
    .sort((a, b) => (b.match - a.match) || (b.t - a.t))
    .slice(0, 40)
    .map(({ id, name, path, match }) => ({ id, name, path, match }))
}

function adminSetSource(articleId, lang, fileId) {
  assertAdmin_()
  const pair = LANGS.find(([l]) => l === lang)
  if (!pair) throw new Error('Unknown language.')
  const id = driveId_(fileId)
  if (!id) throw new Error('Not a Drive file.')
  const file = DriveApp.getFileById(id)
  if (!isHtmlFile_(file) && file.getMimeType() !== MimeType.GOOGLE_DOCS) throw new Error(`"${file.getName()}" is not an HTML file or Google Doc.`)
  const { queue, row } = findArticle_(articleId)
  queue.set(row, pair[1], id)
  resetForNewSource_(queue, row)
  return articleById_(articleId)
}

function collectDocs_(folder, path, depth, out) {
  const here = path.concat(folder.getName())
  const it = folder.getFiles()
  while (it.hasNext()) {
    const f = it.next()
    if (f.getMimeType() === MimeType.GOOGLE_DOCS) out.push({ file: f, path: here, html: false })
    else if (isHtmlFile_(f)) out.push({ file: f, path: here, html: true })
  }
  if (depth >= 5) return
  const subs = folder.getFolders()
  while (subs.hasNext()) collectDocs_(subs.next(), here, depth + 1, out)
}

const LANG_WORDS = {
  en: ['en', 'eng', 'english', 'anglais', 'ingles', 'ingl\u00e9s'],
  fr: ['fr', 'fra', 'french', 'francais', 'fran\u00e7ais', 'frances', 'franc\u00e9s'],
  es: ['es', 'esp', 'spanish', 'espanol', 'espa\u00f1ol', 'espagnol'],
}

function langOfFolder_(name) {
  const n = str_(name).toLowerCase()
  return ['en', 'fr', 'es'].find((l) => LANG_WORDS[l].indexOf(n) >= 0) || ''
}

// "RDC Presidency Strategic Intelligence - 2026-11-13 - ES" -> title, date, lang, and a language-free base key.
function splitName_(name) {
  const parts = str_(name).split(/\s+[-\u2013\u2014|_]\s+|\s*_\s*/).map((p) => p.trim()).filter(Boolean)
  let lang = ''
  let date = null
  const keep = []
  parts.forEach((p) => {
    const low = p.toLowerCase()
    const l = ['en', 'fr', 'es'].find((x) => LANG_WORDS[x].indexOf(low) >= 0)
    const dm = p.match(/^(\d{4})[-_. ](\d{2})[-_. ](\d{2})$/)
    if (l && !lang) lang = l
    else if (dm && !date) { date = new Date(`${dm[1]}-${dm[2]}-${dm[3]}T12:00:00`); keep.push(p) }
    else keep.push(p)
  })
  const title = keep.filter((p) => !/^\d{4}[-_. ]\d{2}[-_. ]\d{2}$/.test(p)).join(' - ') || str_(name)
  return { lang, date, title, base: keep.join(' - ') }
}

/* ---------------- Topic requests ---------------- */

function intakeTopic_(b) {
  if (str_(b.website)) return { ok: true }
  const topics = (Array.isArray(b.topics) ? b.topics : []).slice(0, 3).map((t) => cleanInput_(t, 80)).filter(Boolean)
  const custom = cleanInput_(b.custom, 300)
  const audience = cleanInput_(b.role, 40)
  const email = cleanInput_(b.email, 200).toLowerCase()
  const language = cleanInput_(b.language, 5)
  if (!topics.length && !custom) return { ok: false, error: 'invalid' }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'invalid' }
  if (!rateLimit_('tp:all', 120, 3600) || (email && !rateLimit_(`tp:${sha256_(email).slice(0, 20)}`, 5, 3600))) {
    return { ok: false, error: 'rate_limited' }
  }
  const id = `TOP-${Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd')}-${Utilities.getUuid().slice(0, 6).toUpperCase()}`
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    topicsSheet_().appendRow([id, new Date(), topics.join(' | '), custom, audience, email, language, 'NEW'].map(safeCell_))
  } finally {
    lock.releaseLock()
  }
  return { ok: true }
}

function topicsSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.queueSheetId)
  let sheet = ss.getSheetByName(ADMIN.topicsTab)
  if (!sheet) {
    sheet = ss.insertSheet(ADMIN.topicsTab)
    sheet.getRange(1, 1, 1, TOPIC_HEADERS.length).setValues([TOPIC_HEADERS]).setFontWeight('bold')
    sheet.setFrozenRows(1)
  }
  return sheet
}

function topicsView_() {
  const values = topicsSheet_().getDataRange().getValues().slice(1).filter((r) => str_(r[0]))
  const since = Date.now() - 90 * 864e5
  const counts = {}
  const suggestions = []
  values.forEach((r) => {
    const submitted = r[1] instanceof Date ? r[1] : new Date(r[1])
    const status = str_(r[7]).toUpperCase() || 'NEW'
    if (submitted.getTime() >= since) {
      str_(r[2]).split('|').map((t) => t.trim()).filter(Boolean).forEach((t) => { counts[t] = (counts[t] || 0) + 1 })
    }
    if (str_(r[3])) {
      suggestions.push({ id: str_(r[0]), submitted: fmtDate_(submitted, true), custom: str_(r[3]), topics: str_(r[2]),
        audience: str_(r[4]), email: str_(r[5]), language: str_(r[6]), status })
    }
  })
  const ranking = Object.keys(counts).map((t) => ({ topic: t, count: counts[t] })).sort((a, b) => b.count - a.count)
  return { total: values.length, ranking, suggestions: suggestions.reverse() }
}

/* ---------------- Access requests storage ---------------- */

function requestsSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.queueSheetId)
  let sheet = ss.getSheetByName(ADMIN.requestsTab)
  if (!sheet) {
    sheet = ss.insertSheet(ADMIN.requestsTab)
    sheet.getRange(1, 1, 1, REQ_HEADERS.length).setValues([REQ_HEADERS]).setFontWeight('bold')
    sheet.setFrozenRows(1)
  }
  return sheet
}

function readRequests_() {
  const values = requestsSheet_().getDataRange().getValues()
  const headers = values[0]
  return values.slice(1).map((cells, i) => {
    const obj = { rowNumber: i + 2 }
    headers.forEach((h, c) => { obj[h] = cells[c] })
    obj.status = str_(obj.status).toUpperCase()
    obj.request_id = str_(obj.request_id)
    obj.code_hash = str_(obj.code_hash)
    return obj
  }).filter((r) => r.request_id)
}

function findRequest_(requestId) {
  const sheet = requestsSheet_()
  const req = readRequests_().find((r) => r.request_id === str_(requestId))
  if (!req) throw new Error(`Request ${requestId} was not found.`)
  return { sheet, req }
}

function writeRequest_(sheet, rowNumber, fields) {
  Object.keys(fields).forEach((key) => {
    const col = REQ_HEADERS.indexOf(key)
    if (col >= 0) sheet.getRange(rowNumber, col + 1).setValue(safeCell_(fields[key]))
  })
}

function publicRequest_(r) {
  return {
    id: r.request_id,
    submitted: fmtDate_(r.submitted_at, true),
    name: str_(r.name),
    email: str_(r.email),
    company: str_(r.company),
    industry: str_(r.industry),
    reason: str_(r.reason),
    status: r.status,
    decidedAt: fmtDate_(r.decided_at, true),
    note: str_(r.decision_note),
    expires: fmtDate_(r.code_expires_at),
    expired: Boolean(r.code_expires_at) && new Date(r.code_expires_at).getTime() < Date.now(),
  }
}

/* ---------------- Helpers ---------------- */

function isAdmin_() {
  const email = (Session.getActiveUser().getEmail() || '').toLowerCase()
  if (!email) return false
  const owner = (Session.getEffectiveUser().getEmail() || '').toLowerCase()
  const extra = (PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS') || '')
    .toLowerCase().split(/[\s,]+/).filter(Boolean)
  return email === owner || extra.indexOf(email) >= 0
}

function assertAdmin_() {
  if (!isAdmin_()) throw new Error('Not authorized.')
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

function rateLimit_(key, max, seconds) {
  const cache = CacheService.getScriptCache()
  const n = Number(cache.get(key) || 0)
  if (n >= max) return false
  cache.put(key, String(n + 1), seconds)
  return true
}

function cleanInput_(value, max) {
  return str_(value).replace(/[\u0000-\u001F\u007F<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

// Stops user text like "=IMPORTXML(...)" from being evaluated as a formula in the sheet.
function safeCell_(value) {
  return typeof value === 'string' && /^[=+\-@]/.test(value) ? `'${value}` : value
}

function normalizeCode_(code) {
  return str_(code).toUpperCase().replace(/\s+/g, '').replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
}

function generateCode_() {
  // First hex pair of a v4 UUID is fully random; take one per character.
  const chars = []
  for (let i = 0; i < 8; i++) chars.push(CODE_ALPHABET[parseInt(Utilities.getUuid().slice(0, 2), 16) % CODE_ALPHABET.length])
  return `YNK-${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`
}

function pickOption_(options, re, fallback) {
  const match = options.find((o) => re.test(str_(o)))
  return match || fallback
}

function sendMail_(to, subject, html) {
  if (!to) return
  MailApp.sendEmail({ to, subject, htmlBody: html, name: 'YNK Tech USA' })
}

function esc_(s) {
  return str_(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fmtDate_(value, withTime) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d)) return str_(value)
  return Utilities.formatDate(d, Session.getScriptTimeZone(), withTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd')
}
