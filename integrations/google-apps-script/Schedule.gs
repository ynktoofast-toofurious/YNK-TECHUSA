/** Publication scheduling proposal. Owner must verify in /dev before production deployment.
 * Schedule fields live on Editorial_Queue; no credentials or private IDs are returned.
 * Defaults paused. Slots are not publications until bound to real queue article IDs.
 */
const RELEASE_GAP_MS = 3 * 60 * 60 * 1000
const RELEASE_START = Date.parse('2026-11-16T12:00:00-06:00')
const SCHEDULE_FIELDS = ['scheduledAt', 'scheduleSlot', 'publishedAt']

function scheduleQueue_() {
  return openTable_(CONFIG.queueSheetId, CONFIG.queueTab, QUEUE_COLS, 'articleId', SCHEDULE_FIELDS.concat('sources'))
}

function schedulePaused_() {
  return PropertiesService.getScriptProperties().getProperty('PUBLICATION_SCHEDULE_PAUSED') !== 'false'
}

function scheduleTime_(value) {
  if (!value) return 0
  const time = value instanceof Date ? value.getTime() : Date.parse(String(value))
  if (!Number.isFinite(time)) throw new Error('Invalid publication timestamp. Use ISO 8601 with an explicit UTC offset.')
  return time
}

function scheduleGate_(row, now) {
  if (!row.get('scheduleSlot') && !row.get('scheduledAt')) return ''
  if (schedulePaused_()) return 'Scheduled publishing is paused.'
  if (!row.get('scheduledAt')) return 'Publication time is missing.'
  if (scheduleTime_(row.get('scheduledAt')) > now) return 'Waiting for scheduled publication time.'
  if (row.get('publishedAt') || str_(row.get('syncState')).toUpperCase() === SYNC.published) return 'Already published.'
  return ''
}

function scheduleValidateSpacing_(times) {
  const sorted = times.slice().sort((a, b) => a - b)
  if (sorted.some((t, i) => i && t - sorted[i - 1] < RELEASE_GAP_MS)) throw new Error('Publications must be at least three hours apart.')
}

function adminRegisterPublicationSchedule(ids) {
  assertAdmin_()
  if (!Array.isArray(ids) || ids.length !== 7 || new Set(ids).size !== 7) throw new Error('Select seven distinct Editorial Queue article IDs.')
  const lock = LockService.getScriptLock()
  lock.waitLock(30000)
  try {
    const queue = scheduleQueue_()
    const selected = ids.map((id) => {
      const matches = queue.rows.filter((r) => str_(r.get('articleId')) === id)
      if (matches.length !== 1) throw new Error('Each article ID must identify exactly one Editorial Queue row.')
      const row = matches[0]
      if (row.get('publishedAt') || [SYNC.published, SYNC.prOpen].includes(str_(row.get('syncState')).toUpperCase())) throw new Error('Choose unpublished articles without an open PR.')
      return row
    })
    if (queue.rows.some((r) => r.get('scheduleSlot') || r.get('scheduledAt'))) throw new Error('Schedule already registered. Use Reschedule to edit it.')
    const slugs = selected.map((r) => str_(r.get('slug')))
    if (slugs.some((s) => !SLUG_RE.test(s)) || new Set(slugs).size !== 7) throw new Error('Seven distinct valid slugs are required.')
    if (queue.rows.some((r) => !selected.includes(r) && slugs.includes(str_(r.get('slug'))))) throw new Error('A selected slug is already registered to another queue row.')
    // Set pause first: a partially failed Sheets write can never activate a release.
    PropertiesService.getScriptProperties().setProperty('PUBLICATION_SCHEDULE_PAUSED', 'true')
    selected.forEach((row, i) => {
      queue.set(row, 'scheduleSlot', i + 1)
      queue.set(row, 'scheduledAt', new Date(RELEASE_START + i * RELEASE_GAP_MS).toISOString())
    })
    SpreadsheetApp.flush()
  } finally { lock.releaseLock() }
  return adminPublicationSchedule()
}

function adminReschedulePublication(id, iso) {
  assertAdmin_()
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/.test(String(iso))) throw new Error('Include a UTC offset, for example 2026-11-16T12:00:00-06:00.')
  const time = scheduleTime_(iso)
  if (time <= Date.now()) throw new Error('Choose a future publication time.')
  const lock = LockService.getScriptLock()
  lock.waitLock(30000)
  try {
    const queue = scheduleQueue_()
    const row = queue.rows.find((r) => str_(r.get('articleId')) === id)
    if (!row || !row.get('scheduleSlot') || row.get('publishedAt') || str_(row.get('syncState')).toUpperCase() === SYNC.published) throw new Error('Only registered, unpublished articles can be rescheduled.')
    scheduleValidateSpacing_(queue.rows.filter((r) => r !== row && r.get('scheduledAt')).map((r) => scheduleTime_(r.get('scheduledAt'))).concat(time))
    queue.set(row, 'scheduledAt', new Date(time).toISOString())
    SpreadsheetApp.flush()
  } finally { lock.releaseLock() }
  return adminPublicationSchedule()
}

function adminPausePublicationSchedule(paused) {
  assertAdmin_()
  const lock = LockService.getScriptLock()
  lock.waitLock(30000)
  try { PropertiesService.getScriptProperties().setProperty('PUBLICATION_SCHEDULE_PAUSED', paused === false ? 'false' : 'true') }
  finally { lock.releaseLock() }
  return adminPublicationSchedule()
}

// Structural checks plus explicit editorial reviews. Semantic translation and rights
// ownership require human review; the scheduler never marks those reviews as passed.
function scheduledReadiness_(row, built, assets, links) {
  REVIEWS.forEach(([key, name]) => {
    if (!/^(pass|passed|approved|verified|reviewed|cleared)$/i.test(str_(row.get(key)))) throw new Error(`Scheduled release needs ${name} approval.`)
  })
  if (/REJECT/i.test(str_(row.get('approval'))) || /^(Rejected|Backlog) /.test(str_(row.get('error')))) throw new Error('Article is in backlog.')
  const key = publishKey_()
  if (!key || !LANGS.every(([, col]) => {
    const file = DriveApp.getFileById(driveId_(row.get(col)))
    return isHtmlFile_(file) && hasPublishMeta_(file.getBlob().getDataAsString('UTF-8'), key)
  })) throw new Error('All three HTML editions require existing auto-publish authorization.')
  if (!built.meta.source_references.length || built.warnings.length || built.fixes) throw new Error('Resolve citations, image warnings and copy corrections before release.')
  if (Object.keys(built.images).length) throw new Error('Scheduled illustrations must come from the reviewed asset registry. Remove embedded images from the HTML editions.')
  const refs = links.filter((r) => str_(r.get('articleId')) === built.articleId && /^(pass|passed|approved|final|published)$/i.test(str_(r.get('status'))))
  const ids = [...new Set(refs.map((r) => str_(r.get('assetId'))))]
  if (ids.length !== 3 || !refs.some((r) => /^(hero|cover)$/i.test(str_(r.get('placement'))) && str_(r.get('assetId')) === built.meta.hero_asset_id)) throw new Error('Require three approved original illustrations, including an explicit cover.')
  const files = new Set()
  ids.forEach((id) => {
    const asset = assets[id]
    if (!asset || !/^(original|owned)$/i.test(str_(asset.get('rights'))) || BLOCKED_USE_RE.test(str_(asset.get('useStatus')))) throw new Error('All illustrations require original/owned rights and permitted use.')
    if (!/^https:\/\/\S+$/.test(str_(asset.get('source'))) || !str_(asset.get('credit') || asset.get('publisher'))) throw new Error('Each illustration needs a source citation and creator credit.')
    LANGS.forEach(([lang]) => {
      const cap = `caption${lang[0].toUpperCase()}${lang.slice(1)}`
      const alt = `alt${lang[0].toUpperCase()}${lang.slice(1)}`
      if (!str_(asset.get(cap)) || !str_(asset.get(alt))) throw new Error('Every illustration needs EN/FR/ES captions and alt text.')
    })
    const fileId = driveId_(asset.get('file'))
    if (!fileId || files.has(fileId)) throw new Error('Illustrations must use three distinct original files.')
    files.add(fileId)
    const counter = { fixes: 0 }
    const image = buildAsset_(id, asset, counter)
    if (counter.fixes) throw new Error('Resolve illustration copy corrections before release.')
    Object.assign(built.files, image.files)
    if (id !== built.meta.hero_asset_id) LANGS.forEach(([lang]) => {
      built.editions[lang].blocks.push({ type: 'img', src: image.asset.file, alt: image.asset.alt[lang], caption: `${image.asset.caption[lang]} (${image.asset.credit})`, href: image.asset.source_url })
    })
  })
  const signatures = LANGS.map(([lang]) => built.editions[lang].blocks.map((b) => b.type).join(','))
  if (new Set(signatures).size !== 1) throw new Error('EN/FR/ES section and illustration structures must match.')
  const citations = LANGS.map(([lang]) => {
    const urls = new Set()
    const visit = (value) => {
      if (!value || typeof value !== 'object') return
      if (typeof value.href === 'string') urls.add(value.href)
      Object.values(value).forEach((v) => { if (v && typeof v === 'object') visit(v) })
    }
    visit(built.editions[lang])
    return [...urls].sort().join('|')
  })
  if (new Set(citations).size !== 1) throw new Error('EN/FR/ES citation links must match.')
  LANGS.forEach(([lang]) => { built.files[`articles/${built.slug}/${lang}.json`] = json64_(built.editions[lang]) })
  built.hash = sha256_(Object.keys(built.files).sort().map((k) => k + built.files[k]).join('|'))
}

function adminSchedulePreview(id) {
  assertAdmin_()
  const preview = adminPreview(id)
  try {
    const { row } = findArticle_(id)
    const assets = {}
    openTable_(CONFIG.registrySheetId, CONFIG.assetsTab, ASSET_COLS, 'assetId', []).rows.forEach((r) => { assets[str_(r.get('assetId'))] = r })
    const links = openTable_(CONFIG.registrySheetId, CONFIG.articleImagesTab, ARTICLE_IMAGE_COLS, 'articleId', []).rows
    const built = buildArticle_(row, assets, links)
    preview.editions = built.editions
    Object.keys(built.files).filter((path) => path.startsWith('images/')).forEach((path) => {
      const ext = path.split('.').pop()
      preview.images[path] = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${built.files[path]}`
    })
    preview.readinessError = ''
  } catch (e) { preview.readinessError = String(e.message || e) }
  return preview
}

function adminPublicationSchedule() {
  assertAdmin_()
  const queue = scheduleQueue_()
  const rows = queue.rows.filter((r) => r.get('scheduleSlot'))
  return {
    paused: schedulePaused_(), registered: rows.length,
    candidates: queue.rows.filter((r) => !r.get('scheduleSlot') && ![SYNC.published, SYNC.prOpen].includes(str_(r.get('syncState')).toUpperCase())).map((r) => ({ id: str_(r.get('articleId')), title: str_(r.get('titleEn')) })),
    slots: Array.from({ length: 7 }, (_, i) => {
      const row = rows.find((r) => Number(r.get('scheduleSlot')) === i + 1)
      const time = row ? scheduleTime_(row.get('scheduledAt')) : RELEASE_START + i * RELEASE_GAP_MS
      return { slot: i + 1, article: row ? articleView_(queue, row) : null, category: row ? str_(row.get('type')) : '',
        scheduledAt: new Date(time).toISOString(), central: Utilities.formatDate(new Date(time), 'America/Chicago', 'yyyy-MM-dd h:mm a z'),
        status: row ? row.get('publishedAt') ? 'Published' : scheduleGate_(row, Date.now()) || 'Due: readiness checked before release' : 'Unregistered',
        illustrationStatus: row ? 'Validated at preview and release' : 'Missing' }
    }),
  }
}
