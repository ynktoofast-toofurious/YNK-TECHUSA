/**
 * YNK Tech Intelligence: Google Drive -> GitHub publishing bridge (Google Apps Script).
 *
 * Reads the Editorial Queue sheet, takes ONLY rows marked APPROVED_FOR_SYNC, exports the
 * EN/FR/ES Google Docs plus rights-checked images, and opens a pull request that adds them under
 * ynk-react/public/intelligence/. Nothing is pushed to main; you merge the PR to publish.
 *
 * Setup (one time):
 *  1. script.google.com > New project. Paste this file as Code.gs and appsscript.json as the manifest
 *     (Project Settings > "Show appsscript.json manifest file").
 *  2. GitHub > Settings > Developer settings > Fine-grained tokens > Generate:
 *     Repository access: only ynktoofast-toofurious/YNK-TECHUSA.
 *     Permissions: Contents = Read and write, Pull requests = Read and write (Metadata = Read is automatic).
 *  3. Apps Script > Project Settings > Script Properties > add GITHUB_TOKEN = <token>.
 *     Never paste the token into this code, a sheet, chat, or the repo.
 *  4. Run testConnection() once (authorize when prompted). Then run installHourlyTrigger().
 *
 * Queue columns (header names, case-insensitive): article_id, slug, status, doc_en, doc_fr, doc_es,
 * plus optional type, publish_date, tags, hero_asset_id, source_references.
 * The script adds sync_hash, pr_url, last_sync, sync_note if they are missing.
 * Status flow: DRAFT -> (you) APPROVED_FOR_SYNC -> SYNC_PR_OPEN -> PUBLISHED after merge.
 */

const CONFIG = {
  owner: 'ynktoofast-toofurious',
  repo: 'YNK-TECHUSA',
  baseBranch: 'main',
  contentRoot: 'ynk-react/public/intelligence',
  queueSheetId: '1whz0UbIFTJp8QBjPsa1VQcttjoawXNTu9fz36Van1_M',
  queueTab: '', // '' = first tab
  registrySheetId: '1qig-v8xy3jjziXiLcKGHD6Dcn8FYvOHEaRNWkJuxdb4',
  registryTab: '',
  maxImageBytes: 1.5 * 1024 * 1024,
}

const STATUS = {
  approved: 'APPROVED_FOR_SYNC',
  prOpen: 'SYNC_PR_OPEN',
  published: 'PUBLISHED',
  prClosed: 'SYNC_PR_CLOSED',
  error: 'SYNC_ERROR',
}

const QUEUE_COLS = {
  articleId: ['article_id', 'article id', 'id'],
  slug: ['slug'],
  status: ['status', 'approval_state', 'editorial_status', 'approval status'],
  type: ['type', 'content_type'],
  date: ['publish_date', 'date', 'publication_date'],
  tags: ['tags'],
  docEn: ['doc_en', 'en_doc', 'english_doc', 'en doc link', 'en_doc_url', 'english doc link'],
  docFr: ['doc_fr', 'fr_doc', 'french_doc', 'fr doc link', 'fr_doc_url', 'french doc link'],
  docEs: ['doc_es', 'es_doc', 'spanish_doc', 'es doc link', 'es_doc_url', 'spanish doc link'],
  heroAssetId: ['hero_asset_id', 'hero_asset'],
  sources: ['source_references', 'sources', 'source_urls'],
  syncHash: ['sync_hash'],
  prUrl: ['pr_url'],
  lastSync: ['last_sync'],
  note: ['sync_note'],
}

const REGISTRY_COLS = {
  assetId: ['asset_id', 'asset id', 'id'],
  rights: ['rights_status', 'rights', 'image_rights', 'clearance', 'clearance_status', 'rights status'],
  file: ['drive_file_id', 'file_id', 'drive_url', 'drive_link', 'file_url', 'image_url', 'drive file'],
  credit: ['credit', 'photo_credit', 'attribution'],
  source: ['source_url', 'original_url', 'source', 'source link'],
  altEn: ['alt_en', 'alt_text_en', 'alt', 'alt text'],
  altFr: ['alt_fr', 'alt_text_fr'],
  altEs: ['alt_es', 'alt_text_es'],
}

const LANGS = [['en', 'docEn'], ['fr', 'docFr'], ['es', 'docEs']]
const TYPES = ['analysis', 'release', 'engineering']
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CLEARED_RE = /^(cleared|rights[ _-]?cleared|approved|licensed|owned|original|yes)$/i
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/* ---------------- Entry points ---------------- */

function syncApprovedArticles() {
  const lock = LockService.getScriptLock()
  if (!lock.tryLock(30000)) return
  try {
    const token = getToken_()
    const queue = openTable_(CONFIG.queueSheetId, CONFIG.queueTab, QUEUE_COLS, 'articleId', ['syncHash', 'prUrl', 'lastSync', 'note'])
    refreshPrStatuses_(queue, token)

    const registry = openTable_(CONFIG.registrySheetId, CONFIG.registryTab, REGISTRY_COLS, 'assetId', [])
    const assets = {}
    registry.rows.forEach((r) => { const id = str_(r.get('assetId')); if (id) assets[id] = r })

    const files = {}
    const batch = []
    queue.rows.forEach((row) => {
      if (str_(row.get('status')).toUpperCase() !== STATUS.approved) return
      try {
        const built = buildArticle_(row, assets)
        if (built.hash === str_(row.get('syncHash'))) {
          queue.set(row, 'note', 'Unchanged since last sync; nothing to send.')
          if (str_(row.get('prUrl'))) queue.set(row, 'status', STATUS.prOpen)
          return
        }
        Object.assign(files, built.files)
        batch.push({ row, built })
      } catch (e) {
        queue.set(row, 'status', STATUS.error)
        queue.set(row, 'note', String(e.message || e).slice(0, 480))
      }
    })
    if (!batch.length) return

    const pr = openPullRequest_(token, files, batch)
    const now = new Date()
    batch.forEach(({ row, built }) => {
      queue.set(row, 'status', STATUS.prOpen)
      queue.set(row, 'prUrl', pr.html_url)
      queue.set(row, 'syncHash', built.hash)
      queue.set(row, 'lastSync', now)
      queue.set(row, 'note', built.fixes ? `${built.fixes} em dash/emoji fix(es) applied automatically.` : 'Sent for review.')
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
  const queue = openTable_(CONFIG.queueSheetId, CONFIG.queueTab, QUEUE_COLS, 'articleId', [])
  const registry = openTable_(CONFIG.registrySheetId, CONFIG.registryTab, REGISTRY_COLS, 'assetId', [])
  Logger.log('GitHub repo: %s (push access: %s)', repo.full_name, repo.permissions && repo.permissions.push)
  Logger.log('Queue rows: %s, columns found: %s', queue.rows.length, Object.keys(queue.map).join(', '))
  Logger.log('Registry rows: %s, columns found: %s', registry.rows.length, Object.keys(registry.map).join(', '))
}

/* ---------------- Article export ---------------- */

function buildArticle_(row, assets) {
  const articleId = str_(row.get('articleId'))
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,80}$/.test(articleId)) throw new Error('article_id is missing or has invalid characters.')

  const counter = { fixes: 0 }
  const editions = {}
  LANGS.forEach(([lang, col]) => {
    const docId = driveId_(row.get(col))
    if (!docId) throw new Error(`Missing ${lang.toUpperCase()} Google Doc link.`)
    editions[lang] = parseDoc_(docId, counter)
  })

  const slug = str_(row.get('slug')) || slugify_(editions.en.title)
  if (!SLUG_RE.test(slug) || slug.length > 80) throw new Error(`Invalid slug "${slug}". Use lowercase letters, numbers and hyphens.`)

  const type = TYPES.indexOf(str_(row.get('type')).toLowerCase()) >= 0 ? str_(row.get('type')).toLowerCase() : 'analysis'
  const rawDate = row.get('date')
  const date = Utilities.formatDate(rawDate instanceof Date ? rawDate : new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  const tags = str_(row.get('tags')).split(',').map((t) => clean_(t, counter)).filter(Boolean).slice(0, 6)
  const sources = str_(row.get('sources')).split(/[\s,]+/).filter((u) => /^https:\/\/\S+$/i.test(u))

  const files = {}
  const heroId = str_(row.get('heroAssetId'))
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
  return { slug, articleId, files, hash, fixes: counter.fixes, langs: LANGS.length, hasImage: Boolean(heroId) }
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
  if (!row) throw new Error(`hero_asset_id ${assetId} is not in the Image Asset Registry.`)
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,80}$/.test(assetId)) throw new Error(`Invalid asset_id ${assetId}.`)
  const altEn = clean_(row.get('altEn'), counter)
  const alt = {
    en: altEn,
    fr: clean_(row.get('altFr'), counter) || altEn,
    es: clean_(row.get('altEs'), counter) || altEn,
  }
  if (!altEn) throw new Error(`Asset ${assetId} needs alt text.`)
  const sourceUrl = /^https:\/\/\S+$/i.test(str_(row.get('source'))) ? str_(row.get('source')) : ''
  const cleared = CLEARED_RE.test(str_(row.get('rights')))
  const files = {}
  const asset = { asset_id: assetId, rights: cleared ? 'cleared' : 'unverified', alt, source_url: sourceUrl }

  if (cleared) {
    const fileId = driveId_(row.get('file'))
    if (!fileId) throw new Error(`Cleared asset ${assetId} has no Drive file link.`)
    const blob = DriveApp.getFileById(fileId).getBlob()
    const ext = IMAGE_TYPES[blob.getContentType()]
    if (!ext) throw new Error(`Asset ${assetId} must be JPG, PNG or WebP.`)
    const bytes = blob.getBytes()
    if (bytes.length > CONFIG.maxImageBytes) throw new Error(`Asset ${assetId} is over 1.5 MB; upload an optimized version.`)
    const credit = clean_(row.get('credit'), counter)
    if (!credit) throw new Error(`Cleared asset ${assetId} needs a credit.`)
    asset.credit = credit
    asset.file = `images/${assetId}.${ext}`
    files[asset.file] = Utilities.base64Encode(bytes)
  } else if (!sourceUrl) {
    throw new Error(`Asset ${assetId} is not rights-cleared and has no https source link to point to.`)
  }
  files[`assets/${assetId}.json`] = json64_(asset)
  return files
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
    'Checks run automatically on this PR. Review the preview, then **merge to publish**; GitHub Pages deploys from `main`.',
  ].join('\n')
  return gh_(token, 'POST', '/pulls', { title: message, head: branch, base: CONFIG.baseBranch, body, maintainer_can_modify: true })
}

function refreshPrStatuses_(queue, token) {
  const cache = {}
  queue.rows.forEach((row) => {
    if (str_(row.get('status')).toUpperCase() !== STATUS.prOpen) return
    const m = str_(row.get('prUrl')).match(/\/pull\/(\d+)/)
    if (!m) return
    const pr = cache[m[1]] || (cache[m[1]] = gh_(token, 'GET', `/pulls/${m[1]}`))
    if (pr.merged_at) {
      queue.set(row, 'status', STATUS.published)
      queue.set(row, 'note', `Published ${pr.merged_at.slice(0, 10)}.`)
    } else if (pr.state === 'closed') {
      queue.set(row, 'status', STATUS.prClosed)
      queue.set(row, 'note', 'Pull request was closed without merging.')
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
  const sheet = tabName ? ss.getSheetByName(tabName) : ss.getSheets()[0]
  if (!sheet) throw new Error(`Tab "${tabName}" not found in ${ss.getName()}.`)
  const values = sheet.getDataRange().getValues()
  const norm = (s) => String(s).toLowerCase().replace(/[\s_-]+/g, '')
  const findMap = (headerRow) => {
    const map = {}
    const headers = headerRow.map(norm)
    Object.keys(cols).forEach((key) => {
      for (const alias of cols[key]) {
        const idx = headers.indexOf(norm(alias))
        if (idx >= 0) { map[key] = idx; break }
      }
    })
    return map
  }

  let headerIdx = -1
  let map = {}
  for (let r = 0; r < Math.min(values.length, 6); r++) {
    const m = findMap(values[r])
    if (m[requiredKey] != null) { headerIdx = r; map = m; break }
  }
  if (headerIdx < 0) throw new Error(`Could not find a header row with ${cols[requiredKey][0]} in ${ss.getName()}.`)

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
    map,
    rows,
    set: (row, key, value) => sheet.getRange(row.rowNumber, map[key] + 1).setValue(value),
  }
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
