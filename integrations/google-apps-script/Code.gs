/**
 * YNK Tech Intelligence: Google Drive -> GitHub publishing bridge (Google Apps Script).
 *
 * Reads Editorial_Queue, takes ONLY rows with approval_status = APPROVED_FOR_SYNC whose review
 * checks have passed, exports the EN/FR/ES Google Docs plus rights-checked images, and opens a pull
 * request under ynk-react/public/intelligence/. Nothing is pushed to main; you merge the PR to publish.
 *
 * Setup (one time):
 *  1. script.google.com > New project. Paste this file as Code.gs and appsscript.json as the manifest.
 *  2. GitHub fine-grained token, only ynktoofast-toofurious/YNK-TECHUSA,
 *     Contents = Read and write, Pull requests = Read and write.
 *  3. Project Settings > Script Properties > GITHUB_TOKEN = <token>. Never put the token in code, sheets or chat.
 *  4. Run testConnection(), then installHourlyTrigger().
 *
 * You edit: approval_status (DRAFT -> APPROVED_FOR_SYNC), language_review, source_review, image_rights_review.
 * The script writes: sync_state (SYNC_PR_OPEN -> PUBLISHED, or SYNC_ERROR / SYNC_BLOCKED / SYNC_PR_CLOSED),
 * pr_url, last_sync_hash, last_error. Editing a published article's Docs sends an update PR automatically.
 */

const CONFIG = {
  owner: 'ynktoofast-toofurious',
  repo: 'YNK-TECHUSA',
  baseBranch: 'main',
  contentRoot: 'ynk-react/public/intelligence',
  queueSheetId: '1whz0UbIFTJp8QBjPsa1VQcttjoawXNTu9fz36Van1_M',
  queueTab: 'Editorial_Queue',
  registrySheetId: '1qig-v8xy3jjziXiLcKGHD6Dcn8FYvOHEaRNWkJuxdb4',
  assetsTab: 'Image_Assets',
  articleImagesTab: 'Article_Images',
  maxImageBytes: 1.5 * 1024 * 1024,
  resizeWidth: 1600,
}

const APPROVED = 'APPROVED_FOR_SYNC'
const SYNC = {
  prOpen: 'SYNC_PR_OPEN',
  published: 'PUBLISHED',
  prClosed: 'SYNC_PR_CLOSED',
  error: 'SYNC_ERROR',
  blocked: 'SYNC_BLOCKED',
}

const QUEUE_COLS = {
  articleId: ['article_id'],
  slug: ['slug'],
  date: ['issue_date', 'publish_date', 'date'],
  approval: ['approval_status'],
  languageReview: ['language_review'],
  sourceReview: ['source_review'],
  imageReview: ['image_rights_review'],
  docEn: ['doc_en_id', 'doc_en'],
  docFr: ['doc_fr_id', 'doc_fr'],
  docEs: ['doc_es_id', 'doc_es'],
  type: ['type', 'content_type'],
  tags: ['tags'],
  sources: ['source_references', 'sources'],
  syncState: ['sync_state'],
  prUrl: ['pr_url'],
  syncHash: ['last_sync_hash'],
  error: ['last_error'],
}

const ASSET_COLS = {
  assetId: ['asset_id'],
  rights: ['rights_status'],
  useStatus: ['use_status'],
  file: ['drive_original_file_id', 'drive_original_url'],
  credit: ['photographer_credit'],
  publisher: ['publisher'],
  source: ['source_post_url'],
  altEn: ['alt_en'],
  altFr: ['alt_fr'],
  altEs: ['alt_es'],
  captionEn: ['caption_en'],
  captionFr: ['caption_fr'],
  captionEs: ['caption_es'],
}

const ARTICLE_IMAGE_COLS = {
  articleId: ['article_id'],
  assetId: ['asset_id'],
  placement: ['placement'],
  order: ['display_order'],
  status: ['editorial_status'],
}

const LANGS = [['en', 'docEn'], ['fr', 'docFr'], ['es', 'docEs']]
const REVIEWS = [['languageReview', 'language_review'], ['sourceReview', 'source_review'], ['imageReview', 'image_rights_review']]
const TYPES = ['analysis', 'release', 'engineering']
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{2,80}$/
const PASSED_RE = /^(pass|passed|approved|ok|yes|true|complete|completed|done|cleared|verified|n\/?a|not applicable)$/i
const CLEARED_RE = /^(cleared|rights[ _-]?cleared|cleared[ _-]for[ _-]\w+|approved|licensed|owned|original|public[ _-]domain|permission[ _-]granted|yes)$/i
const BLOCKED_USE_RE = /(link|reference|do[ _-]?not|blocked|restricted|pending|unverified)/i
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/* ---------------- Entry points ---------------- */

function syncApprovedArticles() {
  const lock = LockService.getScriptLock()
  if (!lock.tryLock(30000)) return
  try {
    const token = getToken_()
    const queue = openTable_(CONFIG.queueSheetId, CONFIG.queueTab, QUEUE_COLS, 'articleId', ['syncState', 'prUrl', 'syncHash', 'error'])
    refreshPrStatuses_(queue, token)

    const assetsTable = openTable_(CONFIG.registrySheetId, CONFIG.assetsTab, ASSET_COLS, 'assetId', [])
    const linksTable = openTable_(CONFIG.registrySheetId, CONFIG.articleImagesTab, ARTICLE_IMAGE_COLS, 'articleId', [])
    const assets = {}
    assetsTable.rows.forEach((r) => { assets[str_(r.get('assetId'))] = r })

    const files = {}
    const batch = []
    queue.rows.forEach((row) => {
      const id = str_(row.get('articleId'))
      const approval = str_(row.get('approval'))
      if (approval.toUpperCase() !== APPROVED) { Logger.log('%s: skipped (approval_status = %s)', id, approval || 'empty'); return }
      if (str_(row.get('syncState')).toUpperCase() === SYNC.prOpen) { Logger.log('%s: skipped (pull request already open)', id); return }
      try {
        const pending = REVIEWS.filter(([key]) => !PASSED_RE.test(str_(row.get(key)))).map(([, name]) => name)
        if (pending.length) {
          Logger.log('%s: BLOCKED, waiting on %s', id, pending.join(', '))
          setIfChanged_(queue, row, 'syncState', SYNC.blocked)
          setIfChanged_(queue, row, 'error', `Waiting on review: ${pending.join(', ')} (mark as PASS, APPROVED or N/A).`)
          return
        }
        const built = buildArticle_(row, assets, linksTable.rows)
        if (built.hash === str_(row.get('syncHash'))) { Logger.log('%s: unchanged since last sync', id); return }
        Object.assign(files, built.files)
        batch.push({ row, built })
      } catch (e) {
        Logger.log('%s: ERROR %s', id, e.message)
        setIfChanged_(queue, row, 'syncState', SYNC.error)
        setIfChanged_(queue, row, 'error', String(e.message || e).slice(0, 480))
      }
    })
    if (!batch.length) { Logger.log('Nothing to send.'); return }

    const pr = openPullRequest_(token, files, batch)
    Logger.log('Pull request opened: %s', pr.html_url)
    batch.forEach(({ row, built }) => {
      queue.set(row, 'syncState', SYNC.prOpen)
      queue.set(row, 'prUrl', pr.html_url)
      queue.set(row, 'syncHash', built.hash)
      queue.set(row, 'error', '')
    })
  } finally {
    lock.releaseLock()
  }
}

function installHourlyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'syncApprovedArticles')
    .forEach((t) => ScriptApp.deleteTrigger(t))
  ScriptApp.newTrigger('syncApprovedArticles').timeBased().everyHours(1).create()
}

function testConnection() {
  const repo = gh_(getToken_(), 'GET', '')
  Logger.log('GitHub repo: %s (push access: %s)', repo.full_name, repo.permissions && repo.permissions.push)
  ;[
    [CONFIG.queueSheetId, CONFIG.queueTab, QUEUE_COLS, 'articleId'],
    [CONFIG.registrySheetId, CONFIG.assetsTab, ASSET_COLS, 'assetId'],
    [CONFIG.registrySheetId, CONFIG.articleImagesTab, ARTICLE_IMAGE_COLS, 'articleId'],
  ].forEach(([id, tab, cols, key]) => {
    const t = openTable_(id, tab, cols, key, [])
    const missing = Object.keys(cols).filter((k) => t.map[k] == null)
    Logger.log('%s: %s rows | found: %s | not found: %s', t.tab, t.rows.length, Object.keys(t.map).join(', '), missing.join(', ') || 'none')
  })
}

// Logs every tab's first non-empty row in both sheets so column names can be mapped.
function listHeaders() {
  [['Queue', CONFIG.queueSheetId], ['Registry', CONFIG.registrySheetId]].forEach(([label, id]) => {
    SpreadsheetApp.openById(id).getSheets().forEach((sh) => {
      const vals = sh.getRange(1, 1, Math.min(sh.getLastRow() || 1, 20), Math.max(sh.getLastColumn(), 1)).getValues()
      const row = vals.find((r) => r.filter((c) => str_(c)).length >= 2) || []
      Logger.log('%s / "%s": %s', label, sh.getName(), row.filter((c) => str_(c)).join(' | ') || '(empty)')
    })
  })
}

// Dry run: builds every approved article without touching GitHub or the sheet, and logs the result.
function previewApproved() {
  const queue = openTable_(CONFIG.queueSheetId, CONFIG.queueTab, QUEUE_COLS, 'articleId', [])
  const assetsTable = openTable_(CONFIG.registrySheetId, CONFIG.assetsTab, ASSET_COLS, 'assetId', [])
  const linksTable = openTable_(CONFIG.registrySheetId, CONFIG.articleImagesTab, ARTICLE_IMAGE_COLS, 'articleId', [])
  const assets = {}
  assetsTable.rows.forEach((r) => { assets[str_(r.get('assetId'))] = r })
  queue.rows.forEach((row) => {
    const id = str_(row.get('articleId'))
    try {
      const built = buildArticle_(row, assets, linksTable.rows)
      Logger.log('%s [approval=%s]: OK slug=%s, files=%s, fixes=%s', id, str_(row.get('approval')), built.slug, Object.keys(built.files).join(', '), built.fixes)
    } catch (e) {
      Logger.log('%s [approval=%s]: %s', id, str_(row.get('approval')), e.message)
    }
  })
}

/* ---------------- Article export ---------------- */

function buildArticle_(row, assets, imageLinks) {
  const articleId = str_(row.get('articleId'))
  if (!ID_RE.test(articleId)) throw new Error('article_id is missing or has invalid characters.')

  const counter = { fixes: 0 }
  const editions = {}
  LANGS.forEach(([lang, col]) => {
    const docId = driveId_(row.get(col))
    if (!docId) throw new Error(`Missing doc_${lang}_id.`)
    editions[lang] = parseDoc_(docId, counter)
  })

  const slug = str_(row.get('slug')) || slugify_(editions.en.title)
  if (!SLUG_RE.test(slug) || slug.length > 80) throw new Error(`Invalid slug "${slug}". Use lowercase letters, numbers and hyphens.`)

  const rawType = str_(row.get('type')).toLowerCase()
  const type = TYPES.indexOf(rawType) >= 0 ? rawType : 'analysis'
  const rawDate = row.get('date')
  const parsedDate = rawDate instanceof Date ? rawDate : (str_(rawDate) ? new Date(str_(rawDate)) : new Date())
  const date = Utilities.formatDate(isNaN(parsedDate) ? new Date() : parsedDate, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  const tags = str_(row.get('tags')).split(',').map((t) => clean_(t, counter)).filter(Boolean).slice(0, 6)
  const sources = str_(row.get('sources')).split(/[\s,]+/).filter((u) => /^https:\/\/\S+$/i.test(u))

  const files = {}
  const heroId = pickHero_(articleId, imageLinks)
  if (heroId) Object.assign(files, buildAsset_(heroId, assets[heroId], counter))

  const meta = {
    article_id: articleId,
    slug,
    status: 'published',
    type,
    date,
    tags,
    languages: LANGS.map(([l]) => l),
    hero_asset_id: heroId || null,
    source_references: sources,
  }
  files[`articles/${slug}/meta.json`] = json64_(meta)
  LANGS.forEach(([lang]) => { files[`articles/${slug}/${lang}.json`] = json64_(editions[lang]) })

  const hash = sha256_(Object.keys(files).sort().map((k) => k + files[k]).join('|'))
  return { slug, articleId, files, hash, fixes: counter.fixes, hasImage: Boolean(heroId) }
}

function pickHero_(articleId, imageLinks) {
  const rows = imageLinks.filter((r) => str_(r.get('articleId')) === articleId && str_(r.get('assetId')))
    .filter((r) => !str_(r.get('status')) || PASSED_RE.test(str_(r.get('status'))) || /publish|final/i.test(str_(r.get('status'))))
  if (!rows.length) return ''
  const hero = rows.find((r) => /hero|cover|lead|main/i.test(str_(r.get('placement'))))
  if (hero) return str_(hero.get('assetId'))
  rows.sort((a, b) => (Number(a.get('order')) || 999) - (Number(b.get('order')) || 999))
  return str_(rows[0].get('assetId'))
}

function parseDoc_(docId, counter) {
  const doc = DocumentApp.openById(docId)
  const body = doc.getBody()
  const H = DocumentApp.ParagraphHeading
  let title = ''
  let summary = ''
  let list = null
  const blocks = []

  for (let i = 0; i < body.getNumChildren(); i++) {
    const el = body.getChild(i)
    const type = el.getType()
    if (type === DocumentApp.ElementType.LIST_ITEM) {
      const text = clean_(el.asListItem().getText(), counter)
      if (!text) continue
      if (!list) { list = { type: 'ul', items: [] }; blocks.push(list) }
      list.items.push(text)
      continue
    }
    list = null
    if (type !== DocumentApp.ElementType.PARAGRAPH) continue
    const p = el.asParagraph()
    const text = clean_(p.getText(), counter)
    if (!text) continue
    const heading = p.getHeading()
    const summaryMatch = text.match(/^(summary|r[ée]sum[ée]|resumen)\s*:\s*(.+)$/i)

    if (!title && (heading === H.TITLE || (heading === H.HEADING1 && blocks.length === 0))) { title = text; continue }
    if (!summary && (heading === H.SUBTITLE || summaryMatch)) { summary = summaryMatch ? summaryMatch[2] : text; continue }
    if (heading === H.HEADING1 || heading === H.HEADING2) blocks.push({ type: 'h2', text })
    else if (heading === H.HEADING3 || heading === H.HEADING4 || heading === H.HEADING5 || heading === H.HEADING6) blocks.push({ type: 'h3', text })
    else blocks.push({ type: 'p', text })
  }

  title = (title || clean_(doc.getName(), counter)).slice(0, 200)
  if (!summary) {
    const first = blocks.find((b) => b.type === 'p')
    summary = first ? first.text : title
  }
  if (summary.length > 600) summary = `${summary.slice(0, 590).replace(/\s+\S*$/, '')}\u2026`
  if (!blocks.length) throw new Error(`Google Doc "${doc.getName()}" has no body content.`)
  return { title, summary, blocks }
}

function buildAsset_(assetId, row, counter) {
  if (!row) throw new Error(`Image ${assetId} is linked in Article_Images but missing from Image_Assets.`)
  if (!ID_RE.test(assetId)) throw new Error(`Invalid asset_id ${assetId}.`)
  const altEn = clean_(row.get('altEn'), counter)
  if (!altEn) throw new Error(`Image ${assetId} needs alt_en.`)
  const tri = (en, fr, es) => {
    const base = clean_(row.get(en), counter)
    return { en: base, fr: clean_(row.get(fr), counter) || base, es: clean_(row.get(es), counter) || base }
  }
  const alt = tri('altEn', 'altFr', 'altEs')
  const caption = tri('captionEn', 'captionFr', 'captionEs')
  const sourceUrl = /^https:\/\/\S+$/i.test(str_(row.get('source'))) ? str_(row.get('source')) : ''
  const cleared = CLEARED_RE.test(str_(row.get('rights'))) && !BLOCKED_USE_RE.test(str_(row.get('useStatus')))
  const asset = { asset_id: assetId, rights: cleared ? 'cleared' : 'unverified', alt, source_url: sourceUrl }
  if (caption.en) asset.caption = caption
  const files = {}

  if (cleared) {
    const fileId = driveId_(row.get('file'))
    if (!fileId) throw new Error(`Cleared image ${assetId} has no drive_original_file_id.`)
    const image = loadImage_(fileId, assetId)
    const credit = clean_(row.get('credit'), counter) || clean_(row.get('publisher'), counter)
    if (!credit) throw new Error(`Cleared image ${assetId} needs photographer_credit or publisher.`)
    asset.credit = credit
    asset.file = `images/${assetId}.${image.ext}`
    files[asset.file] = Utilities.base64Encode(image.bytes)
  } else if (!sourceUrl) {
    throw new Error(`Image ${assetId} is not rights-cleared and has no https source_post_url to link to.`)
  }
  files[`assets/${assetId}.json`] = json64_(asset)
  return files
}

// Uses the original if it is small enough, otherwise Drive's resized rendition.
function loadImage_(fileId, assetId) {
  const blob = DriveApp.getFileById(fileId).getBlob()
  const ext = IMAGE_TYPES[blob.getContentType()]
  const bytes = blob.getBytes()
  if (ext && bytes.length <= CONFIG.maxImageBytes) return { ext, bytes }

  const auth = { headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` }, muteHttpExceptions: true }
  const info = UrlFetchApp.fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=thumbnailLink&supportsAllDrives=true`, auth)
  const link = info.getResponseCode() === 200 ? JSON.parse(info.getContentText()).thumbnailLink : ''
  if (link) {
    const res = UrlFetchApp.fetch(link.replace(/=s\d+$/, `=s${CONFIG.resizeWidth}`), auth)
    const resized = res.getBlob()
    const rext = IMAGE_TYPES[resized.getContentType()]
    if (res.getResponseCode() === 200 && rext && resized.getBytes().length <= CONFIG.maxImageBytes) {
      return { ext: rext, bytes: resized.getBytes() }
    }
  }
  throw new Error(`Image ${assetId} must be JPG, PNG or WebP under 1.5 MB (automatic resize failed).`)
}

/* ---------------- GitHub ---------------- */

function openPullRequest_(token, files, batch) {
  const baseSha = gh_(token, 'GET', `/git/ref/heads/${CONFIG.baseBranch}`).object.sha
  const baseTree = gh_(token, 'GET', `/git/commits/${baseSha}`).tree.sha
  const tree = Object.keys(files).sort().map((path) => ({
    path: `${CONFIG.contentRoot}/${path}`,
    mode: '100644',
    type: 'blob',
    sha: gh_(token, 'POST', '/git/blobs', { content: files[path], encoding: 'base64' }).sha,
  }))
  const treeSha = gh_(token, 'POST', '/git/trees', { base_tree: baseTree, tree }).sha
  const slugs = batch.map((b) => b.built.slug)
  const message = `Intelligence: publish ${slugs.join(', ')}`
  const commitSha = gh_(token, 'POST', '/git/commits', { message, tree: treeSha, parents: [baseSha] }).sha
  const branch = `intelligence/sync-${Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd-HHmmss')}`
  gh_(token, 'POST', '/git/refs', { ref: `refs/heads/${branch}`, sha: commitSha })

  const lines = batch.map(({ built }) =>
    `- **${built.articleId}** \`${built.slug}\`: EN/FR/ES${built.hasImage ? ', hero image' : ''}${built.fixes ? `, ${built.fixes} em dash/emoji fix(es)` : ''}`)
  const body = [
    'Approved in the YNK Tech Editorial Queue and exported from Google Drive.',
    '',
    ...lines,
    '',
    'Checks run automatically on this PR. Review, then **merge to publish**; GitHub Pages deploys from `main`.',
  ].join('\n')
  return gh_(token, 'POST', '/pulls', { title: message, head: branch, base: CONFIG.baseBranch, body, maintainer_can_modify: true })
}

function refreshPrStatuses_(queue, token) {
  const cache = {}
  queue.rows.forEach((row) => {
    if (str_(row.get('syncState')).toUpperCase() !== SYNC.prOpen) return
    const m = str_(row.get('prUrl')).match(/\/pull\/(\d+)/)
    if (!m) return
    const pr = cache[m[1]] || (cache[m[1]] = gh_(token, 'GET', `/pulls/${m[1]}`))
    if (pr.merged_at) {
      queue.set(row, 'syncState', SYNC.published)
    } else if (pr.state === 'closed') {
      queue.set(row, 'syncState', SYNC.prClosed)
      queue.set(row, 'error', 'Pull request was closed without merging. Edit the Docs to send a new version.')
    }
  })
}

function gh_(token, method, path, body) {
  const res = UrlFetchApp.fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    contentType: 'application/json',
    payload: body ? JSON.stringify(body) : undefined,
    muteHttpExceptions: true,
  })
  const code = res.getResponseCode()
  if (code >= 300) throw new Error(`GitHub ${method} ${path || '/'} failed (${code}): ${res.getContentText().slice(0, 200)}`)
  return JSON.parse(res.getContentText())
}

function getToken_() {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN')
  if (!token) throw new Error('Add GITHUB_TOKEN in Project Settings > Script Properties.')
  return token
}

/* ---------------- Sheets helpers ---------------- */

function openTable_(sheetId, tabName, cols, requiredKey, ensureKeys) {
  const ss = SpreadsheetApp.openById(sheetId)
  const sheet = ss.getSheetByName(tabName)
  if (!sheet) throw new Error(`Tab "${tabName}" not found in ${ss.getName()}.`)
  // "asset_id (PK)" -> "assetid"
  const norm = (s) => String(s).toLowerCase().replace(/\(.*?\)/g, '').replace(/[\s_-]+/g, '')
  const values = sheet.getDataRange().getValues()

  let headerIdx = -1
  let map = {}
  for (let r = 0; r < Math.min(values.length, 20); r++) {
    const headers = values[r].map(norm)
    const m = {}
    Object.keys(cols).forEach((key) => {
      for (const alias of cols[key]) {
        const idx = headers.indexOf(norm(alias))
        if (idx >= 0) { m[key] = idx; break }
      }
    })
    if (m[requiredKey] != null && Object.keys(m).length > Object.keys(map).length) { headerIdx = r; map = m }
  }
  if (headerIdx < 0) throw new Error(`No "${cols[requiredKey][0]}" header found in ${ss.getName()} / ${tabName}.`)

  ensureKeys.forEach((key) => {
    if (map[key] != null) return
    const col = sheet.getLastColumn() + 1
    sheet.getRange(headerIdx + 1, col).setValue(cols[key][0])
    map[key] = col - 1
  })

  const rows = values.slice(headerIdx + 1).map((cells, i) => ({
    rowNumber: headerIdx + 2 + i,
    get: (key) => (map[key] != null && map[key] < cells.length ? cells[map[key]] : ''),
  })).filter((r) => str_(r.get(requiredKey)))

  return {
    tab: tabName,
    map,
    rows,
    set: (row, key, value) => sheet.getRange(row.rowNumber, map[key] + 1).setValue(value),
  }
}

function setIfChanged_(table, row, key, value) {
  if (str_(row.get(key)) !== str_(value)) table.set(row, key, value)
}

/* ---------------- Utilities ---------------- */

function clean_(value, counter) {
  let text = str_(value).replace(/\s+/g, ' ').trim()
  const dashes = (text.match(/\u2014/g) || []).length
  const emoji = (text.match(EMOJI_RE) || []).length
  if (dashes) text = text.replace(/\s*\u2014\s*/g, ', ')
  if (emoji) text = text.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim()
  counter.fixes += dashes + emoji
  return text
}

function str_(v) {
  return v == null ? '' : String(v).trim()
}

function driveId_(value) {
  const s = str_(value)
  const m = s.match(/\/d\/([A-Za-z0-9_-]{20,})/) || s.match(/[?&]id=([A-Za-z0-9_-]{20,})/) || s.match(/^([A-Za-z0-9_-]{20,})$/)
  return m ? m[1] : ''
}

function slugify_(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '')
}

function json64_(obj) {
  return Utilities.base64Encode(`${JSON.stringify(obj, null, 2)}\n`, Utilities.Charset.UTF_8)
}

function sha256_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8)
    .map((b) => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('')
}
