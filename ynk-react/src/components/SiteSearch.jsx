import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { buildIndex, searchIndex } from '../content/search'
import { useHubChat } from '../utils/hubChat'
import HubAnswer from './HubAnswer'
import { ArrowRight, CloseIcon } from './Icons'

const SearchIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const isTyping = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </svg>
)

// A question (or three words or more) offers an AI answer drawn from YNK content.
const isQuestion = (q) => /\?\s*$/.test(q) || q.split(/\s+/).filter(Boolean).length >= 3


export default function SiteSearch() {
  const { t, language } = useLanguage()
  const s = t('hubSearch')
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [followUp, setFollowUp] = useState('')
  const chat = useHubChat(language)
  const inputRef = useRef(null)

  const index = useMemo(() => buildIndex(language, t), [language, t])
  const results = useMemo(() => searchIndex(index, query), [index, query])
  const trimmed = query.trim()
  const askable = isQuestion(trimmed)
  const options = askable ? [{ ask: true, href: '#ask' }, ...results] : results

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

  const close = () => { setOpen(false); setQuery(''); setActive(0); setFollowUp(''); chat.reset() }

  const go = (entry) => {
    close()
    if (entry.native) window.location.href = entry.href
    else navigate(entry.href)
  }

  const ask = (q) => chat.send(q, true)

  const sendFollowUp = (e) => {
    e.preventDefault()
    chat.send(followUp)
    setFollowUp('')
  }

  const choose = (option) => (option.ask ? ask(trimmed) : go(option))

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { close(); return }
    if (!options.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % options.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + options.length) % options.length) }
    else if (e.key === 'Enter') { e.preventDefault(); choose(options[Math.min(active, options.length - 1)]) }
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
                aria-expanded={options.length > 0}
                aria-controls="ss-results"
                aria-activedescendant={options.length ? `ss-opt-${Math.min(active, options.length - 1)}` : undefined}
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

            {chat.turns.length > 0 && (
              <section className="ss-answer" aria-live="polite">
                {chat.turns.map((turn) => (turn.role === 'user'
                  ? <p key={turn.id} className="ss-answer-q"><SparkIcon /> {turn.text}</p>
                  : <HubAnswer key={turn.id} turn={turn} s={s} onOpen={go} />
                ))}
                {chat.pending && <p className="ss-answer-wait">{s.thinking}</p>}
                {!chat.pending && chat.turns.some((t) => t.mode === 'ai') && <p className="ss-answer-note">{s.aiNote}</p>}
                {!chat.pending && (
                  <form className="ss-follow" onSubmit={sendFollowUp}>
                    <input
                      type="text"
                      value={followUp}
                      onChange={(e) => setFollowUp(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') close() }}
                      placeholder={s.followUp}
                      maxLength={300}
                      aria-label={s.followUp}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!followUp.trim()}>{s.send}</button>
                  </form>
                )}
              </section>
            )}

            <p className="ss-label">{trimmed ? s.results : s.recent}</p>
            {options.length ? (
              <ul className="ss-results" id="ss-results" role="listbox">
                {options.map((entry, i) => (
                  <li
                    key={entry.href}
                    id={`ss-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={`ss-item${entry.ask ? ' ss-item--ask' : ''}${i === active ? ' active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(entry)}
                  >
                    {entry.ask ? (
                      <>
                        <span className="ss-kind ss-kind--ask"><SparkIcon /></span>
                        <span className="ss-text">
                          <strong>{s.ask}: {trimmed}</strong>
                          <small>{s.askHint}</small>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={`ss-kind ss-kind--${entry.kind}`}>{s.kinds[entry.kind] || entry.kind}</span>
                        <span className="ss-text">
                          <strong>{entry.label}</strong>
                          {entry.text && <small>{entry.text}</small>}
                        </span>
                      </>
                    )}
                    <ArrowRight />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ss-empty">{s.empty.replace('{q}', trimmed)}</p>
            )}

            <div className="ss-foot">
              <button type="button" className="hub-link" onClick={() => { close(); navigate(`/latest${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ''}`) }}>
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
