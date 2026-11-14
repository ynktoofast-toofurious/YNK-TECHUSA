import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { INTELLIGENCE, INTELLIGENCE_ASSETS, formatDate, tagLabel } from '../content/latest'
import { getMember } from '../content/vault'
import { ArrowLeft, ArrowRight } from '../components/Icons'

const blockText = (b) => {
  if (b.type === 'ul' || b.type === 'ol') return b.items.map((i) => (typeof i === 'string' ? i : i.text)).join(' ')
  if (b.type === 'table') return b.rows.flat().join(' ')
  if (b.type === 'img') return b.caption || b.alt || ''
  return b.text || ''
}

// Non-members read about 10 percent of the piece (by text length), never more than 15.
const PREVIEW_SHARE = 0.1
const PREVIEW_MAX = 0.15

function previewCount(blocks) {
  const lens = blocks.map((b) => blockText(b).length)
  const total = lens.reduce((a, n) => a + n, 0)
  let shown = 0
  let count = 0
  for (const len of lens) {
    if (count > 0 && (shown >= total * PREVIEW_SHARE || shown + len > total * PREVIEW_MAX)) break
    shown += len
    count += 1
  }
  return Math.min(count, Math.max(blocks.length - 1, 1))
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchJson = (url, fresh) =>
  fetch(url, fresh ? { cache: 'no-cache' } : undefined)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))

// Retries bypass the browser cache, which can hold a 404 from just before a publish finished deploying.
async function loadEdition(slug, language) {
  const base = `/intelligence/articles/${slug}/`
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fetchJson(`${base}${language}.json`, attempt > 0)
    } catch {
      if (attempt < 2) await wait(600 * (attempt + 1))
    }
  }
  if (language !== 'en') return fetchJson(`${base}en.json`, true)
  throw new Error('unavailable')
}

const safeHttps = (url) => {
  try { return new URL(url).protocol === 'https:' ? url : null } catch { return null }
}
const hostOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function Rich({ text, runs }) {
  if (!runs) return text
  return runs.map((r, i) => {
    let node = r.text
    if (r.italic) node = <em>{node}</em>
    if (r.bold) node = <strong>{node}</strong>
    const href = r.href && safeHttps(r.href)
    return href
      ? <a key={i} href={href} target="_blank" rel="noopener noreferrer nofollow">{node}</a>
      : <span key={i}>{node}</span>
  })
}

function InlineImage({ block, t }) {
  const href = block.href && safeHttps(block.href)
  if (!block.src) {
    return href ? (
      <a className="ar-hero-link" href={href} target="_blank" rel="noopener noreferrer nofollow">
        <span>{block.caption || block.alt}</span>
        <span className="hub-link">{t('latestUi.article.imageAtSource')} <ArrowRight /></span>
      </a>
    ) : null
  }
  return (
    <figure className="ar-figure">
      <img src={`/intelligence/${block.src}`} alt={block.alt} loading="lazy" decoding="async" />
      {(block.caption || href) && (
        <figcaption>
          {block.caption}
          {href && <>{block.caption ? ' · ' : ''}<a href={href} target="_blank" rel="noopener noreferrer nofollow">{hostOf(href)}</a></>}
        </figcaption>
      )}
    </figure>
  )
}

function Block({ block, t }) {
  switch (block.type) {
    case 'h2': return <h2><Rich {...block} /></h2>
    case 'h3': return <h3><Rich {...block} /></h3>
    case 'quote': return <blockquote><Rich {...block} /></blockquote>
    case 'ul':
    case 'ol': {
      const List = block.type
      return <List>{block.items.map((item, i) => <li key={i}>{typeof item === 'string' ? item : <Rich {...item} />}</li>)}</List>
    }
    case 'img': return <InlineImage block={block} t={t} />
    case 'table': {
      const [head, ...rest] = block.head ? block.rows : [null, ...block.rows]
      return (
        <div className="ar-table">
          <table>
            {head && <thead><tr>{head.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>}
            <tbody>{rest.map((row, r) => <tr key={r}>{row.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )
    }
    default: return <p><Rich {...block} /></p>
  }
}

function HeroAsset({ asset, language, t }) {
  if (!asset) return null
  const alt = asset.alt?.[language] || asset.alt?.en || ''
  const caption = asset.caption?.[language] || asset.caption?.en || ''
  const source = safeHttps(asset.source_url)
  if (asset.rights === 'cleared' && asset.file) {
    return (
      <figure className="ar-hero">
        <img src={`/intelligence/${asset.file}`} alt={alt} loading="eager" decoding="async" />
        <figcaption>
          {caption && <span className="ar-caption">{caption}</span>}
          {t('latestUi.article.credit')}: {asset.credit}
          {source && <> · <a href={source} target="_blank" rel="noopener noreferrer nofollow">{hostOf(source)}</a></>}
        </figcaption>
      </figure>
    )
  }
  return source ? (
    <a className="ar-hero-link" href={source} target="_blank" rel="noopener noreferrer nofollow">
      <span>{caption || alt}</span>
      <span className="hub-link">{t('latestUi.article.imageAtSource')} <ArrowRight /></span>
    </a>
  ) : null
}

export default function Article() {
  const { slug } = useParams()
  const { t, language } = useLanguage()
  const meta = INTELLIGENCE.find((a) => a.slug === slug)
  const [reload, setReload] = useState(0)
  const key = `${slug}:${language}:${reload}`
  const [result, setResult] = useState({ key: null, doc: null, error: false })

  useEffect(() => {
    if (!meta) return
    let active = true
    loadEdition(meta.slug, language)
      .then((doc) => active && setResult({ key, doc, error: false }))
      .catch(() => active && setResult({ key, doc: null, error: true }))
    return () => { active = false }
  }, [meta, language, key])

  if (!meta) return <Navigate to="/latest" replace />

  const loading = result.key !== key
  const doc = loading ? null : result.doc
  const title = doc?.title || meta.title[language] || meta.title.en
  const sources = meta.source_references.map(safeHttps).filter(Boolean)
  const isMember = Boolean(getMember())
  const visible = doc ? (isMember ? doc.blocks : doc.blocks.slice(0, previewCount(doc.blocks))) : []
  const gated = doc && !isMember
  const g = t('latestUi.article.gate')

  return (
    <div className="hub ar-page">
      <div className="hub-bg" aria-hidden="true">
        <div className="hub-glow hub-glow-a" />
        <div className="hub-grid" />
      </div>

      <article className="ar container">
        <Link to="/latest" className="hub-link ar-back"><ArrowLeft /> {t('latestUi.article.back')}</Link>
        <div className="lt-meta">
          <span className={`lt-type lt-type--${meta.type}`}>{t(`latestUi.types.${meta.type}`)}</span>
          <time dateTime={meta.date}>{formatDate(meta.date, language)}</time>
        </div>
        <h1 className="ar-title">{title}</h1>
        {meta.tags.length > 0 && (
          <ul className="lt-tags ar-tags">{meta.tags.map((tag) => <li key={tag}>{tagLabel(tag, language)}</li>)}</ul>
        )}

        <HeroAsset asset={INTELLIGENCE_ASSETS[meta.hero_asset_id]} language={language} t={t} />

        {loading && <p className="ar-status" role="status">{t('latestUi.article.loading')}</p>}
        {!loading && result.error && (
          <div className="ar-status" role="alert">
            <p>{t('latestUi.article.unavailable')}</p>
            <button type="button" className="btn btn-secondary hub-btn-round" onClick={() => setReload((n) => n + 1)}>
              {t('latestUi.article.retry')}
            </button>
          </div>
        )}
        {doc && (
          <div className={`ar-body${gated ? ' ar-body--preview' : ''}`}>
            <p className="ar-summary">{doc.summary}</p>
            {visible.map((block, i) => <Block key={i} block={block} t={t} />)}
          </div>
        )}

        {gated && (
          <section className="ar-gate" aria-labelledby="ar-gate-title">
            <span className="section-tag">{g.tag}</span>
            <h2 id="ar-gate-title">{g.title}</h2>
            <p>{g.text}</p>
            <Link to={`/vault?next=${encodeURIComponent(`/latest/${meta.slug}`)}#enroll`} className="btn btn-primary hub-btn-round">
              {g.cta} <ArrowRight />
            </Link>
            <small>{g.note}</small>
          </section>
        )}

        {sources.length > 0 && (
          <section className="ar-sources">
            <h2>{t('latestUi.article.sources')}</h2>
            <ol>
              {sources.map((url) => (
                <li key={url}><a href={url} target="_blank" rel="noopener noreferrer nofollow">{hostOf(url)}</a></li>
              ))}
            </ol>
          </section>
        )}

        <aside className="ar-byline">
          <img src="/assets/team/yannick-nkongolo.jpg" alt={t('about.founder.photoAlt')} width="64" height="80" loading="lazy" decoding="async" />
          <div>
            <span className="ar-byline-label">{t('latestUi.article.by')}</span>
            <p>{t('about.founder.byline')}</p>
            <Link to="/about" className="hub-link">{t('about.founder.teaserCta')} <ArrowRight /></Link>
          </div>
        </aside>
      </article>
    </div>
  )
}
