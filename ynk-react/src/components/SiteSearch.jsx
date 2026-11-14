import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { buildIndex, searchIndex } from '../content/search'
import { ArrowRight, CloseIcon } from './Icons'

const SearchIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const isTyping = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

export default function SiteSearch() {
  const { t, language } = useLanguage()
  const s = t('hubSearch')
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  const index = useMemo(() => buildIndex(language, t), [language, t])
  const results = useMemo(() => searchIndex(index, query), [index, query])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setOpen(true) }
      else if (e.key === '/' && !isTyping(document.activeElement)) { e.preventDefault(); setOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const timer = setTimeout(() => inputRef.current?.focus(), 30)
    return () => { document.body.style.overflow = ''; clearTimeout(timer) }
  }, [open])

  const close = () => { setOpen(false); setQuery(''); setActive(0) }

  const go = (entry) => {
    close()
    if (entry.native) window.location.href = entry.href
    else navigate(entry.href)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { close(); return }
    if (!results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + results.length) % results.length) }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[Math.min(active, results.length - 1)]) }
  }

  return (
    <>
      <button type="button" className="ss-btn" onClick={() => setOpen(true)} aria-label={s.open} title={`${s.open} (/)`}>
        <SearchIcon />
        <span className="ss-btn-label">{s.open}</span>
      </button>

      {/* Portal: the fixed navbar is its own stacking context, which would trap the overlay under page widgets. */}
      {open && createPortal(
        <div className="ss-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className="ss-panel" role="dialog" aria-modal="true" aria-label={s.open}>
            <div className="ss-field">
              <SearchIcon size={18} />
              <input
                ref={inputRef}
                type="search"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="ss-results"
                aria-activedescendant={results.length ? `ss-opt-${Math.min(active, results.length - 1)}` : undefined}
                aria-autocomplete="list"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0) }}
                onKeyDown={onKeyDown}
                placeholder={s.placeholder}
                autoComplete="off"
                spellCheck="false"
              />
              <button type="button" className="ss-close" onClick={close} aria-label={s.close}><CloseIcon size={16} /></button>
            </div>

            <p className="ss-label">{query.trim() ? s.results : s.recent}</p>
            {results.length ? (
              <ul className="ss-results" id="ss-results" role="listbox">
                {results.map((entry, i) => (
                  <li
                    key={entry.href}
                    id={`ss-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={`ss-item${i === active ? ' active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(entry)}
                  >
                    <span className={`ss-kind ss-kind--${entry.kind}`}>{s.kinds[entry.kind] || entry.kind}</span>
                    <span className="ss-text">
                      <strong>{entry.label}</strong>
                      {entry.text && <small>{entry.text}</small>}
                    </span>
                    <ArrowRight />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ss-empty">{s.empty.replace('{q}', query.trim())}</p>
            )}

            <div className="ss-foot">
              <button type="button" className="hub-link" onClick={() => { close(); navigate(`/latest${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`) }}>
                {s.viewAll} <ArrowRight />
              </button>
              <span className="ss-keys"><kbd>/</kbd> {s.hint}</span>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
