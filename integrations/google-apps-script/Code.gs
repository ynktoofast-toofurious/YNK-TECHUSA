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
 * The script writes: sync_state (PR_OPEN -> MERGED, or SYNC_ERROR / NOT_SYNCED with the reason in last_error),
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
// Must match the sync_state dropdown in Editorial_Queue.
const SYNC = {
  prOpen: 'PR_OPEN',
  published: 'MERGED',
  prClosed: 'NOT_SYNCED',
  error: 'SYNC_ERROR',
  blocked: 'NOT_SYNCED',
}

const QUEUE_COLS = {
  articleId: ['article_id'],
  slug: ['slug'],
  titleEn: ['title_en'],
  notes: ['notes'],
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
const TYPES = ['analysis', 'study', 'release', 'engineering']
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{2,80}$/
const PASSED_RE = /^(pass|passed|approved|ok|yes|true|complete|completed|done|cleared|verified|reviewed|accepted|confirmed|n\/?a|not applicable)$/i
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
          const detail = REVIEWS.filter(([, name]) => pending.indexOf(name) >= 0)
            .map(([key, name]) => `${name} = "${str_(row.get(key))}" (options: ${queue.options(row, key).join(', ') || 'free text'})`)
          Logger.log('%s: BLOCKED, waiting on %s', id, detail.join('; '))
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

function buildArticle_(row, assets, imageLinks, opts) {
  const articleId = str_(row.get('articleId'))
  if (!ID_RE.test(articleId)) throw new Error('article_id is missing or has invalid characters.')

  const counter = { fixes: 0 }
  const ctx = { counter, prefix: articleId.toLowerCase().replace(/[^a-z0-9-]/g, ''), images: {}, warnings: [] }
  const editions = {}
  LANGS.forEach(([lang, col]) => {
    const docId = driveId_(row.get(col))
    if (!docId) throw new Error(`Missing doc_${lang}_id.`)
    editions[lang] = parseSource_(docId, ctx)
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
  let hero = null
  let imageError = ''
  if (heroId) {
    try {
      hero = buildAsset_(heroId, assets[heroId], counter)
    } catch (e) {
      if (!(opts && opts.lenientImage)) throw e
      imageError = String(e.message || e)
    }
  }
  if (hero) Object.assign(files, hero.files)
  Object.keys(ctx.images).forEach((path) => { files[path] = Utilities.base64Encode(ctx.images[path].bytes) })

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
  return { slug, articleId, files, hash, fixes: counter.fixes, hasImage: Boolean(hero), editions, meta, hero, imageError, images: ctx.images, warnings: ctx.warnings }
}

function parseSource_(fileId, ctx) {
  const file = DriveApp.getFileById(fileId)
  if (file.getMimeType() === MimeType.GOOGLE_DOCS) return parseDoc_(fileId, ctx.counter)
  if (isHtmlFile_(file)) {
    const parents = file.getParents()
    ctx.folder = parents.hasNext() ? parents.next() : null
    return parseHtml_(file.getBlob().getDataAsString('UTF-8'), ctx, file.getName())
  }
  throw new Error(`"${file.getName()}" must be a Google Doc or an .html file.`)
}

function isHtmlFile_(file) {
  return /html/i.test(file.getMimeType()) || /\.html?$/i.test(file.getName())
}

/* ---------------- HTML source ---------------- */

const HTML_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201C', rdquo: '\u201D',
  ndash: '\u2013', mdash: '\u2014', hellip: '\u2026', laquo: '\u00AB', raquo: '\u00BB', copy: '\u00A9', reg: '\u00AE', deg: '\u00B0', euro: '\u20AC',
  eacute: '\u00E9', egrave: '\u00E8', ecirc: '\u00EA', euml: '\u00EB', agrave: '\u00E0', aacute: '\u00E1', acirc: '\u00E2', ccedil: '\u00E7',
  icirc: '\u00EE', iuml: '\u00EF', iacute: '\u00ED', ocirc: '\u00F4', oacute: '\u00F3', ucirc: '\u00FB', ugrave: '\u00F9', uacute: '\u00FA',
  uuml: '\u00FC', ntilde: '\u00F1', iquest: '\u00BF', iexcl: '\u00A1', Eacute: '\u00C9', Agrave: '\u00C0', Ccedil: '\u00C7',
}

function decodeEntities_(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m
    }
    return HTML_ENTITIES[e] != null ? HTML_ENTITIES[e] : m
  })
}

function attr_(attrs, name) {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return m ? decodeEntities_(m[2] != null ? m[2] : m[3] != null ? m[3] : m[4]) : ''
}

function safeHref_(href) {
  return /^https:\/\/[^\s<>"']+$/i.test(str_(href)) ? str_(href) : ''
}

// Converts trusted-format HTML (h1-h4, p, ul/ol/li, blockquote, a, strong/em, img, figure/figcaption, table)
// into the site's block model. Everything else (scripts, styles, attributes) is dropped.
function parseHtml_(html, ctx, fileName) {
  const counter = ctx.counter
  const docTitle = decodeEntities_(((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/<[^>]+>/g, ''))
  const metaDesc = attr_((html.match(/<meta[^>]+name\s*=\s*["']description["'][^>]*>/i) || [''])[0], 'content')
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  const src = (bodyMatch ? bodyMatch[1] : html)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|svg|template|iframe|head|nav|form|button)\b[\s\S]*?<\/\1\s*>/gi, '')

  const blocks = []
  let title = ''
  let summary = ''
  let cur = null
  let list = null
  let item = null
  let table = null
  let tableRow = null
  let cell = null
  let caption = null
  let lastImg = null
  let bold = 0
  let italic = 0
  const links = []

  const target = () => cell || caption || item || cur
  const addText = (raw) => {
    const text = decodeEntities_(raw).replace(/\s+/g, ' ')
    if (!text.trim() && !target()) return
    if (!target()) cur = { type: 'p', runs: [] }
    const t = target()
    const href = links.length ? links[links.length - 1] : ''
    const prev = t.runs[t.runs.length - 1]
    if (prev && prev.href === href && prev.b === bold > 0 && prev.i === italic > 0) prev.text += text
    else t.runs.push({ text, href, b: bold > 0, i: italic > 0 })
  }
  const finishRuns = (runs) => {
    const out = runs.map((r) => {
      const o = { text: cleanRun_(r.text, counter) }
      if (r.href) o.href = r.href
      if (r.b) o.bold = true
      if (r.i) o.italic = true
      return o
    })
    if (out.length) { out[0].text = out[0].text.replace(/^\s+/, ''); out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, '') }
    const kept = out.filter((r) => r.text)
    const text = kept.map((r) => r.text).join('').replace(/\s+/g, ' ').trim()
    const rich = kept.some((r) => r.href || r.bold || r.italic)
    return { text, runs: rich ? kept : null }
  }
  const flushCur = () => {
    if (!cur) return
    const { text, runs } = finishRuns(cur.runs)
    const block = cur
    cur = null
    if (!text) return
    if (block.type === 'title') {
      if (!title) { title = text; return }
      block.type = 'h2'
    }
    if (block.summary && !summary) { summary = text; return }
    const out = { type: block.type, text }
    if (runs) out.runs = runs
    blocks.push(out)
  }
  const flushList = () => {
    if (item) { const { text, runs } = finishRuns(item.runs); if (text) list.items.push(runs ? { text, runs } : text); item = null }
    if (list && list.items.length) blocks.push(list)
    list = null
  }

  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+)/g
  let m
  while ((m = re.exec(src))) {
    if (m[4] != null) { addText(m[4]); continue }
    const closing = m[1] === '/'
    const tag = m[2].toLowerCase()
    const attrs = m[3] || ''
    if (!closing) {
      if (/^h[1-6]$/.test(tag) || tag === 'p' || tag === 'blockquote') {
        if (tag === 'p' && cur && cur.type === 'quote') continue
        if (tag === 'p' && (cell || caption || item)) continue
        flushCur()
        const type = tag === 'h1' ? 'title' : tag === 'h2' ? 'h2' : /^h[3-6]$/.test(tag) ? 'h3' : tag === 'blockquote' ? 'quote' : 'p'
        cur = { type, runs: [], summary: tag === 'p' && /\b(summary|lead|dek|standfirst)\b/i.test(attr_(attrs, 'class')) }
      } else if (tag === 'ul' || tag === 'ol') {
        flushCur()
        if (!list) list = { type: tag, items: [] }
      } else if (tag === 'li') {
        flushCur()
        if (!list) list = { type: 'ul', items: [] }
        if (item) { const { text, runs } = finishRuns(item.runs); if (text) list.items.push(runs ? { text, runs } : text) }
        item = { runs: [] }
      } else if (tag === 'table') {
        flushCur(); flushList()
        table = { type: 'table', rows: [] }
      } else if (tag === 'tr' && table) {
        tableRow = []
      } else if ((tag === 'td' || tag === 'th') && tableRow) {
        cell = { runs: [], th: tag === 'th' }
      } else if (tag === 'figcaption') {
        caption = { runs: [] }
      } else if (tag === 'img') {
        flushCur()
        const img = htmlImage_(attrs, ctx, links.length ? links[links.length - 1] : '')
        if (img) { blocks.push(img); lastImg = img }
      } else if (tag === 'a') {
        links.push(safeHref_(attr_(attrs, 'href')))
      } else if (tag === 'strong' || tag === 'b') {
        bold++
      } else if (tag === 'em' || tag === 'i') {
        italic++
      } else if (tag === 'br') {
        addText(' ')
      } else if (/^(div|section|article|main|header|footer|aside|figure)$/.test(tag)) {
        flushCur()
      }
    } else {
      if (/^h[1-6]$/.test(tag) || tag === 'p' || tag === 'blockquote') {
        if (tag === 'p' && cur && cur.type === 'quote') continue
        if (tag === 'p' && (cell || caption || item)) continue
        flushCur()
      } else if (tag === 'li') {
        if (item && list) { const { text, runs } = finishRuns(item.runs); if (text) list.items.push(runs ? { text, runs } : text) }
        item = null
      } else if (tag === 'ul' || tag === 'ol') {
        flushList()
      } else if ((tag === 'td' || tag === 'th') && cell && tableRow) {
        tableRow.push(finishRuns(cell.runs).text)
        if (cell.th && !table.rows.length) table.head = true
        cell = null
      } else if (tag === 'tr' && tableRow && table) {
        if (tableRow.some(Boolean)) table.rows.push(tableRow.slice(0, 12))
        tableRow = null
      } else if (tag === 'table' && table) {
        if (table.rows.length) blocks.push(Object.assign(table, { rows: table.rows.slice(0, 100) }))
        table = null
      } else if (tag === 'figcaption' && caption) {
        const { text, runs } = finishRuns(caption.runs)
        if (lastImg && text) {
          lastImg.caption = text
          if (!lastImg.alt) lastImg.alt = text.slice(0, 300)
          const link = runs && runs.find((r) => r.href)
          if (link && !lastImg.href) lastImg.href = link.href
        }
        caption = null
      } else if (tag === 'a') {
        links.pop()
      } else if (tag === 'strong' || tag === 'b') {
        bold = Math.max(0, bold - 1)
      } else if (tag === 'em' || tag === 'i') {
        italic = Math.max(0, italic - 1)
      } else if (/^(div|section|article|main|header|footer|aside)$/.test(tag)) {
        flushCur()
      }
    }
  }
  flushCur()
  flushList()

  blocks.forEach((b) => { if (b.type === 'img' && !b.alt) b.alt = title || 'Illustration' })
  title = (title || clean_(docTitle, counter) || clean_(fileName.replace(/\.html?$/i, ''), counter)).slice(0, 200)
  if (!summary) summary = clean_(metaDesc, counter)
  if (!summary) {
    const first = blocks.find((b) => b.type === 'p')
    summary = first ? first.text : title
  }
  if (summary.length > 600) summary = `${summary.slice(0, 590).replace(/\s+\S*$/, '')}\u2026`
  if (!blocks.length) throw new Error(`"${fileName}" has no readable content.`)
  return { title, summary, blocks }
}

function htmlImage_(attrs, ctx, wrapHref) {
  const src = attr_(attrs, 'src').trim()
  const alt = clean_(attr_(attrs, 'alt'), ctx.counter).slice(0, 300)
  let img = null
  try {
    const dm = src.match(/^data:image\/(png|jpe?g|webp);base64,([\s\S]+)$/i)
    if (dm) {
      img = { bytes: Utilities.base64Decode(dm[2].replace(/\s+/g, '')), ext: dm[1].toLowerCase().replace('jpeg', 'jpg') }
    } else if (/^https:\/\/(drive|docs)\.google\.com\//i.test(src) && driveId_(src)) {
      img = loadImage_(driveId_(src), alt || 'image')
    } else if (src && !/^[a-z]+:/i.test(src) && ctx.folder) {
      const it = ctx.folder.getFilesByName(decodeURIComponent(src.split('/').pop()))
      if (it.hasNext()) img = loadImage_(it.next().getId(), src)
    }
  } catch (e) {
    ctx.warnings.push(`Image skipped: ${e.message}`)
    img = null
  }
  if (img && img.bytes.length > CONFIG.maxImageBytes) {
    ctx.warnings.push(`An embedded image is larger than 1.5 MB and was skipped.`)
    img = null
  }
  if (img) {
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, img.bytes)
      .slice(0, 6).map((b) => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('')
    const path = `images/${ctx.prefix}-${digest}.${img.ext}`
    ctx.images[path] = img
    const block = { type: 'img', src: path, alt }
    if (safeHref_(wrapHref)) block.href = safeHref_(wrapHref)
    return block
  }
  if (/^https:\/\//i.test(src)) return { type: 'img', href: safeHref_(wrapHref) || safeHref_(src), alt }
  return null
}

function cleanRun_(text, counter) {
  let t = String(text)
  const dashes = (t.match(/\u2014/g) || []).length
  const emoji = (t.match(EMOJI_RE) || []).length
  if (dashes) t = t.replace(/\s*\u2014\s*/g, ', ')
  if (emoji) t = t.replace(EMOJI_RE, '')
  counter.fixes += dashes + emoji
  return t
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
  let image = null

  if (cleared) {
    const fileId = driveId_(row.get('file'))
    if (!fileId) throw new Error(`Cleared image ${assetId} has no drive_original_file_id.`)
    image = loadImage_(fileId, assetId)
    const credit = clean_(row.get('credit'), counter) || clean_(row.get('publisher'), counter)
    if (!credit) throw new Error(`Cleared image ${assetId} needs photographer_credit or publisher.`)
    asset.credit = credit
    asset.file = `images/${assetId}.${image.ext}`
    files[asset.file] = Utilities.base64Encode(image.bytes)
  } else if (!sourceUrl) {
    throw new Error(`Image ${assetId} is not rights-cleared and has no https source_post_url to link to.`)
  }
  files[`assets/${assetId}.json`] = json64_(asset)
  return { files, asset, image }
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
    options: (row, key) => {
      const rule = sheet.getRange(row.rowNumber, map[key] + 1).getDataValidation()
      const vals = rule ? rule.getCriteriaValues()[0] : null
      return Array.isArray(vals) ? vals.map(String) : []
    },
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
