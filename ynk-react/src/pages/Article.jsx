import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { INTELLIGENCE, INTELLIGENCE_ASSETS, formatDate, tagLabel } from '../content/latest'
import { ArrowLeft, ArrowRight } from '../components/Icons'

const safeHttps = (url) => {
  try { return new URL(url).protocol === 'https:' ? url : null } catch { return null }
}
const hostOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function Block({ block }) {
  switch (block.type) {
    case 'h2': return <h2>{block.text}</h2>
    case 'h3': return <h3>{block.text}</h3>
    case 'quote': return <blockquote>{block.text}</blockquote>
    case 'ul': return <ul>{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
    default: return <p>{block.text}</p>
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
  const key = `${slug}:${language}`
  const [result, setResult] = useState({ key: null, doc: null, error: false })

  useEffect(() => {
    if (!meta) return
    let active = true
    fetch(`/intelligence/articles/${meta.slug}/${language}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((doc) => active && setResult({ key, doc, error: false }))
      .catch(() => active && setResult({ key, doc: null, error: true }))
    return () => { active = false }
  }, [meta, language, key])

  if (!meta) return <Navigate to="/latest" replace />

  const loading = result.key !== key
  const doc = loading ? null : result.doc
  const title = doc?.title || meta.title[language] || meta.title.en
  const sources = meta.source_references.map(safeHttps).filter(Boolean)

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
        {!loading && result.error && <p className="ar-status" role="alert">{t('latestUi.article.unavailable')}</p>}
        {doc && (
          <div className="ar-body">
            <p className="ar-summary">{doc.summary}</p>
            {doc.blocks.map((block, i) => <Block key={i} block={block} />)}
          </div>
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
