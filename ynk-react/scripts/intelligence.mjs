// Validates approved Intelligence content in public/intelligence and generates
// src/content/intelligence.generated.json for the React app.
// Usage: node scripts/intelligence.mjs [--check]
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'public', 'intelligence')
const OUT = join(ROOT, 'src', 'content', 'intelligence.generated.json')
const CHECK_ONLY = process.argv.includes('--check')

const LANGS = ['en', 'fr', 'es']
const TYPES = ['analysis', 'study', 'release', 'engineering']
const BLOCK_TEXT = ['p', 'h2', 'h3', 'quote']
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp']
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{2,80}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

const errors = []
const fail = (where, msg) => errors.push(`${where}: ${msg}`)

function readJson(path, where) {
  try {
    return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''))
  } catch (e) {
    fail(where, `invalid or missing JSON (${e.message})`)
    return null
  }
}

function isHttps(url) {
  try { return new URL(url).protocol === 'https:' } catch { return false }
}

function checkStrings(value, where) {
  if (typeof value === 'string') {
    if (value.includes('\u2014')) fail(where, 'contains an em dash; use a comma, colon, period, or parentheses')
    if (EMOJI_RE.test(value)) fail(where, 'contains an emoji')
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => checkStrings(v, `${where}[${i}]`))
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => checkStrings(v, `${where}.${k}`))
  }
}

const nonEmpty = (s, max) => typeof s === 'string' && s.trim().length > 0 && s.length <= max
const validRuns = (runs) => Array.isArray(runs) && runs.length <= 300 && runs.every((r) =>
  r && typeof r.text === 'string' && r.text.length <= 5000 && (r.href == null || isHttps(r.href)) &&
  (r.bold == null || typeof r.bold === 'boolean') && (r.italic == null || typeof r.italic === 'boolean'))
const listDirs = (p) => (existsSync(p) ? readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory()) : [])
const listJson = (p) => (existsSync(p) ? readdirSync(p).filter((n) => n.endsWith('.json')) : [])

// Assets
const assets = {}
for (const name of listJson(join(CONTENT, 'assets'))) {
  const where = `assets/${name}`
  const a = readJson(join(CONTENT, 'assets', name), where)
  if (!a) continue
  checkStrings(a, where)
  if (!ID_RE.test(a.asset_id || '') || `${a.asset_id}.json` !== name) fail(where, 'asset_id must match the file name')
  if (!LANGS.every((l) => nonEmpty(a.alt?.[l], 300))) fail(where, 'alt text required for en, fr, es')
  if (a.caption != null && !LANGS.every((l) => nonEmpty(a.caption?.[l], 500))) fail(where, 'caption, if present, needs en, fr, es (max 500 chars)')
  if (a.rights === 'cleared') {
    if (!nonEmpty(a.credit, 200)) fail(where, 'credit is required for cleared images')
    const file = typeof a.file === 'string' ? a.file : ''
    const full = join(CONTENT, file)
    if (!file.startsWith('images/') || file.includes('..') || !IMAGE_EXT.some((e) => file.toLowerCase().endsWith(e))) {
      fail(where, 'file must be images/<name>.jpg|jpeg|png|webp')
    } else if (!existsSync(full)) {
      fail(where, `image ${file} not found`)
    } else if (statSync(full).size > MAX_IMAGE_BYTES) {
      fail(where, `image ${file} is larger than 1.5 MB; optimize it first`)
    }
  } else if (a.rights === 'unverified') {
    if (a.file) fail(where, 'unverified images must not be copied; link to source_url instead')
  } else {
    fail(where, 'rights must be "cleared" or "unverified"')
  }
  if (a.source_url && !isHttps(a.source_url)) fail(where, 'source_url must be https')
  if (a.rights === 'unverified' && !a.source_url) fail(where, 'source_url is required for unverified images')
  assets[a.asset_id] = {
    asset_id: a.asset_id,
    rights: a.rights,
    file: a.rights === 'cleared' ? a.file : null,
    credit: a.credit || '',
    source_url: a.source_url || '',
    alt: a.alt,
    caption: a.caption || null,
  }
}

// Articles
const articles = []
const seenIds = new Set()
for (const slug of listDirs(join(CONTENT, 'articles'))) {
  const dir = join(CONTENT, 'articles', slug)
  const where = `articles/${slug}`
  if (!SLUG_RE.test(slug) || slug.length > 80) fail(where, 'folder name must be a lowercase-hyphen slug')
  const meta = readJson(join(dir, 'meta.json'), `${where}/meta.json`)
  if (!meta) continue
  checkStrings(meta, `${where}/meta.json`)
  if (meta.slug !== slug) fail(`${where}/meta.json`, 'slug must match the folder name')
  if (!ID_RE.test(meta.article_id || '')) fail(`${where}/meta.json`, 'article_id is required')
  else if (seenIds.has(meta.article_id)) fail(`${where}/meta.json`, `duplicate article_id ${meta.article_id}`)
  seenIds.add(meta.article_id)
  if (meta.status !== 'published') fail(`${where}/meta.json`, 'status must be "published" (only approved content belongs in the repo)')
  if (!DATE_RE.test(meta.date || '') || Number.isNaN(Date.parse(meta.date))) fail(`${where}/meta.json`, 'date must be YYYY-MM-DD')
  if (!TYPES.includes(meta.type)) fail(`${where}/meta.json`, `type must be one of ${TYPES.join(', ')}`)
  if (!Array.isArray(meta.tags) || meta.tags.length > 6 || !meta.tags.every((t) => nonEmpty(t, 40))) fail(`${where}/meta.json`, 'tags must be up to 6 short strings')
  if (!Array.isArray(meta.source_references) || !meta.source_references.every(isHttps)) fail(`${where}/meta.json`, 'source_references must be https URLs')
  if (meta.hero_asset_id && !assets[meta.hero_asset_id]) fail(`${where}/meta.json`, `hero_asset_id ${meta.hero_asset_id} has no assets/${meta.hero_asset_id}.json`)

  const title = {}
  const summary = {}
  for (const lang of LANGS) {
    const lw = `${where}/${lang}.json`
    const doc = readJson(join(dir, `${lang}.json`), lw)
    if (!doc) continue
    checkStrings(doc, lw)
    if (!nonEmpty(doc.title, 200)) fail(lw, 'title is required (max 200 chars)')
    if (!nonEmpty(doc.summary, 600)) fail(lw, 'summary is required (max 600 chars)')
    if (!Array.isArray(doc.blocks) || doc.blocks.length === 0) {
      fail(lw, 'blocks must be a non-empty array')
    } else {
      doc.blocks.forEach((b, i) => {
        const bw = `${lw}.blocks[${i}]`
        if (BLOCK_TEXT.includes(b?.type)) {
          if (!nonEmpty(b.text, 5000)) fail(bw, 'text is required')
          if (b.runs != null && !validRuns(b.runs)) fail(bw, 'runs must be [{text, href?: https, bold?, italic?}]')
        } else if (b?.type === 'ul' || b?.type === 'ol') {
          const ok = Array.isArray(b.items) && b.items.length > 0 && b.items.every((it) =>
            typeof it === 'string' ? nonEmpty(it, 2000) : nonEmpty(it?.text, 2000) && (it.runs == null || validRuns(it.runs)))
          if (!ok) fail(bw, 'items must be strings or {text, runs}')
        } else if (b?.type === 'img') {
          if (!nonEmpty(b.alt, 300)) fail(bw, 'image alt text is required')
          if (b.caption != null && !nonEmpty(b.caption, 500)) fail(bw, 'caption must be a short string')
          if (b.href != null && !isHttps(b.href)) fail(bw, 'image href must be https')
          if (!b.src && !b.href) fail(bw, 'image needs src or href')
          if (b.src) {
            const full = join(CONTENT, String(b.src))
            if (!String(b.src).startsWith('images/') || String(b.src).includes('..') || !IMAGE_EXT.some((e) => String(b.src).toLowerCase().endsWith(e))) fail(bw, 'src must be images/<name>.jpg|jpeg|png|webp')
            else if (!existsSync(full)) fail(bw, `image ${b.src} not found`)
            else if (statSync(full).size > MAX_IMAGE_BYTES) fail(bw, `image ${b.src} is larger than 1.5 MB`)
          }
        } else if (b?.type === 'table') {
          const ok = Array.isArray(b.rows) && b.rows.length > 0 && b.rows.length <= 100 &&
            b.rows.every((r) => Array.isArray(r) && r.length > 0 && r.length <= 12 && r.every((c) => typeof c === 'string' && c.length <= 500))
          if (!ok) fail(bw, 'table rows must be 1-100 rows of 1-12 short text cells')
        } else {
          fail(bw, 'unknown block type')
        }
      })
    }
    title[lang] = doc.title
    summary[lang] = doc.summary
  }

  articles.push({
    id: meta.article_id,
    slug,
    type: meta.type,
    date: meta.date,
    tags: meta.tags || [],
    hero_asset_id: meta.hero_asset_id || null,
    source_references: meta.source_references || [],
    title,
    summary,
  })
}

if (errors.length) {
  console.error(`Intelligence content check failed (${errors.length}):`)
  errors.forEach((e) => console.error(`  - ${e}`))
  process.exit(1)
}

articles.sort((a, b) => b.date.localeCompare(a.date))
console.log(`Intelligence content OK: ${articles.length} article(s), ${Object.keys(assets).length} asset(s).`)

if (!CHECK_ONLY) {
  writeFileSync(OUT, `${JSON.stringify({ articles, assets }, null, 2)}\n`)
}
