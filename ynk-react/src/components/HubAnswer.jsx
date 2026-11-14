import RequestAccess from './RequestAccess'

// One assistant turn from Ask the Hub: answer with clickable [n] citations, its sources, and any action (request or project).
export default function HubAnswer({ turn, s, onOpen, compact = false }) {
  if (turn.status === 'busy') return <p className="ss-answer-wait">{s.askBusy}</p>
  if (turn.status) return <p className="ss-answer-wait">{s.askError}</p>
  const byN = Object.fromEntries(turn.sources.map((src) => [src.n, src]))
  return (
    <>
      {turn.mode === 'ai' && (
        <p className="ss-answer-text">
          {turn.text.split(/(\[\d+\])/).map((part, i) => {
            const m = part.match(/^\[(\d+)\]$/)
            const src = m && byN[Number(m[1])]
            return src
              ? <button key={i} type="button" className="ss-cite" onClick={() => onOpen(src)} title={src.title}>{m[1]}</button>
              : <span key={i}>{part}</span>
          })}
        </p>
      )}
      {turn.mode === 'guard' && <p className="ss-answer-text">{turn.text}</p>}
      {turn.mode === 'search' && <p className="ss-answer-wait">{s.closest}</p>}
      {turn.mode === 'none' && (
        <p className="ss-answer-wait">
          {s.noAnswer}{' '}
          <button type="button" className="ss-inline-link" onClick={() => onOpen({ href: '/#suggest' })}>{s.suggest}</button>
        </p>
      )}
      {turn.action && turn.action.type === 'request' && (
        <div className="ss-action">
          <p className="ss-action-title">{s.requestHere.replace('{title}', turn.action.item.title)}</p>
          <RequestAccess item={turn.action.item} compact />
        </div>
      )}
      {turn.action && turn.action.type === 'project' && (
        <div className="ss-action">
          <button type="button" className="btn btn-primary hub-btn-round ss-action-btn" onClick={() => onOpen({ href: `/start-project?idea=${encodeURIComponent(turn.question || '')}#studio` })}>
            {s.projectCta}
          </button>
        </div>
      )}
      {turn.sources.length > 0 && (
        <ol className={`ss-sources${compact ? ' ss-sources--compact' : ''}`}>
          {turn.sources.map((src) => (
            <li key={src.href}>
              <button type="button" onClick={() => onOpen(src)}>
                {turn.mode === 'ai' && <span className="ss-cite">{src.n}</span>}
                {!compact && <span className={`ss-kind ss-kind--${src.kind}`}>{s.kinds[src.kind] || src.kind}</span>}
                <span className="ss-source-title">{src.title}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}
