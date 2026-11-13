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
  codeDays: 7,
  siteUrl: 'https://ynk-techusa.com',
  industries: ['Healthcare', 'Finance', 'Education', 'Technology', 'Government', 'Retail', 'Data Engineering'],
}

const REQ_HEADERS = ['request_id', 'submitted_at', 'name', 'email', 'company', 'industry', 'reason', 'status',
  'decided_at', 'decided_by', 'decision_note', 'code_hash', 'code_expires_at']
const REQ = { pending: 'PENDING', approved: 'APPROVED', rejected: 'REJECTED', revoked: 'REVOKED' }
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
    return json_({ ok: false, error: 'unknown_action' })
  } catch (err) {
    console.error(err)
    return json_({ ok: false, error: 'server_error' })
  }
}

function setupAdmin() {
  requestsSheet_()
  MailApp.getRemainingDailyQuota()
  Logger.log('Access_Requests tab ready. Console admin: %s', Session.getEffectiveUser().getEmail())
}

/* ---------------- Console API (google.script.run) ---------------- */

function adminLoad() {
  assertAdmin_()
  const ss = SpreadsheetApp.openById(CONFIG.queueSheetId)
  return {
    user: Session.getActiveUser().getEmail(),
    sheetUrl: ss.getUrl(),
    articles: listArticles_(),
    requests: readRequests_().map(publicRequest_),
  }
}

function adminApproveArticle(articleId) {
  assertAdmin_()
  const { queue, row } = findArticle_(articleId)
  REVIEWS.forEach(([key]) => {
    if (!PASSED_RE.test(str_(row.get(key)))) queue.set(row, key, pickOption_(queue.options(row, key), PASSED_RE, 'PASS'))
  })
  queue.set(row, 'approval', APPROVED)
  if (str_(row.get('syncState')).toUpperCase() !== SYNC.prOpen) {
    queue.set(row, 'syncState', SYNC.blocked)
    // An explicit approval always sends, even if the content matches a previously closed PR.
    queue.set(row, 'syncHash', '')
  }
  queue.set(row, 'error', '')
  SpreadsheetApp.flush()
  syncApprovedArticles()
  return articleById_(articleId)
}

function adminPublishArticle(articleId) {
  assertAdmin_()
  const { queue, row } = findArticle_(articleId)
  const m = str_(row.get('prUrl')).match(/\/pull\/(\d+)/)
  if (!m) throw new Error('No pull request to publish yet. Approve the article first.')
  const token = getToken_()
  const pr = gh_(token, 'GET', `/pulls/${m[1]}`)
  if (!pr.merged_at) {
    if (pr.state !== 'open') throw new Error('The pull request was closed. Approve the article again to send a new one.')
    gh_(token, 'PUT', `/pulls/${m[1]}/merge`, { merge_method: 'squash' })
  }
  queue.set(row, 'syncState', SYNC.published)
  queue.set(row, 'error', '')
  return articleById_(articleId)
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
  queue.set(row, 'error', `Rejected ${stamp}${reason ? `: ${reason}` : ''}`)
  if (queue.map.notes != null) {
    const prev = str_(row.get('notes'))
    queue.set(row, 'notes', safeCell_(`${prev ? `${prev}\n` : ''}Rejected ${stamp}${reason ? `: ${reason}` : ''}`))
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
  else if (sync === SYNC.prOpen) stage = 'ready'
  else if (/REJECT/.test(approval) || /^Rejected /.test(str_(row.get('error')))) stage = 'rejected'
  const docs = {}
  LANGS.forEach(([lang, col]) => {
    const id = driveId_(row.get(col))
    if (id) docs[lang] = `https://docs.google.com/document/d/${id}/edit`
  })
  return {
    id: str_(row.get('articleId')),
    title: str_(row.get('titleEn')) || slug,
    date: fmtDate_(row.get('date')),
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
