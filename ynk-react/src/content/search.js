import { LATEST } from './latest'
import { LIBRARY } from './vault'
import { PAGES } from './pages'

export const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const pick = (value, language) => (value && typeof value === 'object' ? value[language] || value.en || '' : value || '')
// Titles in every language, so a French word finds a piece while browsing in English.
const allTitles = (value) => (value && typeof value === 'object' ? Object.values(value).join(' ') : value || '')

// Every query word must match; titles weigh more than tags, tags more than summaries.
function score(entry, words) {
  let total = 0
  for (const w of words) {
    const inTitle = entry.title.indexOf(w)
    if (inTitle === 0 || entry.title.includes(` ${w}`)) total += 6
    else if (inTitle > 0) total += 4
    else if (entry.tags.includes(w)) total += 3
    else if (entry.body.includes(w)) total += 1
    else return 0
  }
  return total
}

export function buildIndex(language, t) {
  const seen = new Set()
  const entries = []
  const add = (item) => {
    if (seen.has(item.href)) return
    seen.add(item.href)
    entries.push({
      ...item,
      title: normalize(item.label),
      tags: normalize(item.tagText),
      body: normalize(`${item.text} ${item.extra || ''}`),
    })
  }
  LATEST.forEach((item) => add({
    href: item.href,
    native: item.native,
    kind: item.type,
    date: item.date,
    label: pick(item.title, language),
    text: pick(item.summary, language),
    tagText: (item.tags || []).map((tag) => pick(tag, language)).join(' '),
    extra: allTitles(item.title),
  }))
  LIBRARY.forEach((item) => add({
    href: item.href || `/vault?request=${item.id}#request`,
    kind: item.kind,
    date: item.date || '',
    label: pick(item.title, language),
    text: pick(item.summary, language),
    tagText: '',
    extra: allTitles(item.title),
  }))
  PAGES.forEach((page) => add({ href: page.href, kind: 'page', date: '', label: t(page.titleKey), text: '', tagText: '', extra: page.kw }))
  return entries
}

export function searchIndex(entries, query, limit = 8) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (!words.length) return entries.filter((e) => e.kind !== 'page').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  return entries
    .map((e) => ({ e, s: score(e, words) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || b.e.date.localeCompare(a.e.date))
    .slice(0, limit)
    .map((r) => r.e)
}
