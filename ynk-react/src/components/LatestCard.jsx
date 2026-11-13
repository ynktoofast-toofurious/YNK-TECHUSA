import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDate, isRecent, tagLabel } from '../content/latest'
import { ArrowRight } from './Icons'

const icon = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

const TYPE_ICONS = {
  analysis: <svg {...icon} viewBox="0 0 24 24" width="14" height="14"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  release: <svg {...icon} viewBox="0 0 24 24" width="14" height="14"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" /></svg>,
  engineering: <svg {...icon} viewBox="0 0 24 24" width="14" height="14"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
}

const LOCK = <svg {...icon} viewBox="0 0 24 24" width="13" height="13"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>

export default function LatestCard({ item, featured = false, style }) {
  const { t, language } = useLanguage()
  const isNew = isRecent(item.date)
  const title = item.title[language] || item.title.en
  const summary = item.summary[language] || item.summary.en

  const body = (
    <>
      {featured && (
        <svg className="lt-deco" viewBox="0 0 600 160" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={`lt-deco-${item.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#29B5E8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#29B5E8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 120 C60 110 90 70 150 80 S240 130 300 96 S400 30 460 52 S560 70 600 34 L600 160 L0 160 Z" fill={`url(#lt-deco-${item.id})`} />
          <path className="lt-deco-line" pathLength="1" d="M0 120 C60 110 90 70 150 80 S240 130 300 96 S400 30 460 52 S560 70 600 34" />
        </svg>
      )}
      <div className="lt-meta">
        <span className={`lt-type lt-type--${item.type}`}>
          {TYPE_ICONS[item.type]}
          {t(`latestUi.types.${item.type}`)}
        </span>
        <time dateTime={item.date}>{formatDate(item.date, language)}</time>
        {isNew && <span className="lt-new">{t('latestUi.newBadge')}</span>}
      </div>
      <h3 className="lt-title">{title}</h3>
      <p className="lt-summary">{summary}</p>
      <div className="lt-foot">
        <ul className="lt-tags">
          {item.tags.map((tag) => {
            const label = tagLabel(tag, language)
            return <li key={label}>{label}</li>
          })}
        </ul>
        <span className="lt-open">
          {item.vault ? <>{LOCK}{t('latestUi.vault')}</> : <>{t('latestUi.open')}<ArrowRight /></>}
        </span>
      </div>
    </>
  )

  const className = `lt-card${featured ? ' lt-card--featured' : ''}`
  return item.native
    ? <a href={item.href} className={className} style={style} data-reveal>{body}</a>
    : <Link to={item.href} className={className} style={style} data-reveal>{body}</Link>
}
