import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { ArrowRight } from '../components/Icons'
import useReveal from '../hooks/useReveal'

const CALENDLY = 'https://calendly.com/yannicknkongolo7/30min'
const FOUNDER_PHOTO = '/assets/team/yannick-nkongolo.jpg'

export default function About() {
  const { t, language } = useLanguage()
  const a = t('about')
  const revealRef = useReveal([language])

  return (
    <div className="hub ab-page" ref={revealRef}>
      <div className="hub-bg" aria-hidden="true">
        <div className="hub-glow hub-glow-a" />
        <div className="hub-glow hub-glow-b" />
        <div className="hub-grid" />
      </div>

      <section className="lt-hero ab-hero">
        <div className="container">
          <span className="section-tag hx-in" style={{ '--d': 0 }}>{a.tag}</span>
          <h1 className="hub-title hx-in" style={{ '--d': 1 }}>
            {a.title1} <span className="text-gradient">{a.title2}</span>
          </h1>
          <p className="hub-sub hx-in" style={{ '--d': 2 }}>{a.lead}</p>
          <p className="ab-editorial hx-in" style={{ '--d': 3 }}>{a.editorial}</p>
        </div>
      </section>

      <section className="hub-section ab-story" id="story">
        <div className="container ab-split">
          <header className="ab-split-head" data-reveal>
            <span className="section-tag">{a.story.tag}</span>
            <h2 className="hub-title">{a.story.title}</h2>
          </header>
          <div className="ab-prose" data-reveal style={{ '--d': 1 }}>
            {a.story.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            <p className="ab-focus-label">{a.story.focusLabel}</p>
            <ul className="ab-focus">
              {a.story.focus.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="hub-section ab-founder" id="founder">
        <div className="container ab-founder-grid">
          <figure className="ab-photo" data-reveal>
            <img src={FOUNDER_PHOTO} alt={a.founder.photoAlt} width="640" height="800" loading="lazy" decoding="async" />
          </figure>
          <div className="ab-founder-copy" data-reveal style={{ '--d': 1 }}>
            <span className="section-tag">{a.founder.tag}</span>
            <h2 className="hub-title">{a.founder.name}</h2>
            <ul className="ab-roles">
              {a.founder.roles.map((r) => <li key={r}>{r}</li>)}
            </ul>
            <div className="ab-prose">
              {a.founder.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              <p>{a.founder.beliefIntro}</p>
              <blockquote className="ab-belief">{a.founder.belief}</blockquote>
              {a.founder.closing.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary hub-btn-round">
              {t('hubFooter.links.book')} <ArrowRight />
            </a>
          </div>
        </div>
      </section>

      <section className="hub-section ab-mission" id="mission">
        <div className="container">
          <header className="hub-head" data-reveal>
            <span className="section-tag">{a.mission.tag}</span>
            <p className="ab-statement">{a.mission.statement}</p>
            <p className="hub-sub"><strong>{a.mission.bridge}</strong> {a.mission.text}</p>
          </header>
          <h3 className="ab-principles-title" data-reveal>{a.mission.principlesTitle}</h3>
          <ol className="ab-principles">
            {a.mission.principles.map((p, i) => (
              <li key={i} className="ab-principle" data-reveal style={{ '--d': i }}>
                <span className="ab-principle-num">0{i + 1}</span>
                <h4>{p.t}</h4>
                <p>{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="hub-section ab-vp">
        <div className="container ab-vp-grid">
          <article className="ab-card" data-reveal>
            <span className="section-tag">{a.vision.tag}</span>
            <p className="ab-card-lead">{a.vision.text}</p>
            <p>{a.vision.text2}</p>
          </article>
          <article className="ab-card ab-card--promise" data-reveal style={{ '--d': 1 }}>
            <span className="section-tag">{a.promise.tag}</span>
            <blockquote className="ab-card-lead">{a.promise.quote}</blockquote>
            <p className="ab-sign">{a.promise.sign}</p>
          </article>
        </div>
      </section>

      <section className="hub-section ab-cta">
        <div className="container" data-reveal>
          <h2 className="hub-title"><span className="text-gradient">{a.cta.title}</span></h2>
          <div className="ab-cta-row">
            <Link to="/#intelligence" className="btn btn-primary hub-btn-round">{a.cta.explore} <ArrowRight /></Link>
            <Link to="/start-project" className="btn btn-ghost hub-btn-round">{t('hubNav.startProject')}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
