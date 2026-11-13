import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import LatestCard from '../components/LatestCard'
import { LATEST, LATEST_TYPES, markLatestSeen, tagLabel } from '../content/latest'
import useReveal from '../hooks/useReveal'

export default function Latest() {
  const { t, language } = useLanguage()
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState(() => (LATEST_TYPES.includes(searchParams.get('type')) ? searchParams.get('type') : 'all'))
  const [query, setQuery] = useState('')

  useEffect(() => { markLatestSeen() }, [])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return LATEST.filter((item) => {
      if (filter !== 'all' && item.type !== filter) return false
      if (!q) return true
      const haystack = [item.title[language], item.summary[language], item.title.en, ...item.tags.map((tag) => tagLabel(tag, language))].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [filter, query, language])

  const counts = useMemo(() => {
    const c = { all: LATEST.length }
    LATEST_TYPES.forEach((type) => { c[type] = LATEST.filter((i) => i.type === type).length })
    return c
  }, [])

  const revealRef = useReveal([filter, query, language])
  const [featured, ...rest] = items

  return (
    <div className="hub lt-page" ref={revealRef}>
      <div className="hub-bg" aria-hidden="true">
        <div className="hub-glow hub-glow-a" />
        <div className="hub-grid" />
      </div>

      <section className="lt-hero">
        <div className="container">
          <span className="section-tag hx-in" style={{ '--d': 0 }}>{t('latestUi.tag')}</span>
          <h1 className="hub-title hx-in" style={{ '--d': 1 }}>
            {t('latestUi.pageTitle1')} <span className="text-gradient">{t('latestUi.pageTitle2')}</span>
          </h1>
          <p className="hub-sub hx-in" style={{ '--d': 2 }}>{t('latestUi.pageSub')}</p>

          <div className="lt-toolbar hx-in" style={{ '--d': 3 }}>
            <div className="lt-filters" role="tablist" aria-label={t('latestUi.tag')}>
              {['all', ...LATEST_TYPES].map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  className={`lt-filter${filter === key ? ' active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {t(`latestUi.filters.${key}`)}
                  <span className="lt-count">{counts[key]}</span>
                </button>
              ))}
            </div>
            <label className="lt-search">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('latestUi.search')}
                aria-label={t('latestUi.search')}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="lt-list-section">
        <div className="container">
          {items.length === 0 ? (
            <p className="lt-empty">{t('latestUi.empty')}</p>
          ) : (
            <>
              <LatestCard key={`${featured.id}-${language}`} item={featured} featured />
              <div className="lt-grid">
                {rest.map((item, i) => (
                  <LatestCard key={`${item.id}-${language}`} item={item} style={{ '--d': i % 3 }} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
