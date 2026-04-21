import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

/* ── Career Timeline (structural only — text comes from translations) ── */
const TIMELINE_META = [
  { period: '2024 - Present', company: 'YNK-Tech USA',                     color: '#29B5E8', current: false },
  { period: '2022 - Present', company: 'OptumRx \u2013 UnitedHealth Group', color: '#10b981', current: true  },
  { period: '2019 - 2022',   company: 'Group O',                           color: '#f59e0b', current: false },
  { period: '2016 - 2019',   company: 'S&B Industry',                      color: '#8b5cf6', current: false },
  { period: '2015 - 2016',   company: 'SMS',                               color: '#e879f9', current: false },
]

/* ── Engagement icons (structural only) ── */
const ENGAGEMENT_ICONS = [
  <svg key="sf" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  <svg key="pbi" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  <svg key="git" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M6 9v6M15.5 5.5L8.5 12.5"/></svg>,
  <svg key="dbt" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  <svg key="llm" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
]

const ENGAGEMENT_COLORS = ['#29B5E8', '#f2c811', '#f05033', '#ff6849', '#10b981']
const ENGAGEMENT_TOOLS  = ['Snowflake', 'Power BI', 'Git & VS Code', 'dbt', 'Prompt & LLMs']

/* ── Resume structural data (non-translatable fields only) ── */
const RESUME_META = {
  'Data Engineering': {
    name:  'Yannick Nkongolo',
    location: 'Fort Worth, TX',
    email: 'yannicknkongolo7@gmail.com',
    website: 'ynk-techusa.com',
    education: [
      { degree: 'Master of Applied Science', field: 'Data Analytics \u2013 Data Engineering', school: 'Western Governors University', year: 'Jul 2026', expected: true },
      { degree: 'Bachelor of Science',       field: 'Data Analytics',                        school: 'Western Governors University', year: 'May 2025' },
    ],
    certifications: ['Power Platform Certified (PL-900)', 'Alteryx Core Certificate', 'ServiceNow Certified'],
    skillItems: [
      ['Power BI', 'DAX', 'M / Power Query', 'DirectQuery', 'Composite Models', 'Row-Level Security', 'Dataflows', 'Tableau'],
      ['Snowflake', 'dbt', 'Python', 'SQL', 'ETL / ELT Pipelines', 'Alteryx', 'Data Modeling'],
      ['PMPM Metrics', 'Formulary Savings', 'Cost Management', 'Budget vs. Actuals', 'Operational KPIs', 'Drug Utilization'],
      ['AWS S3', 'AWS Lambda', 'API Gateway', 'Azure', 'GitHub Actions', 'CI/CD'],
      ['Salesforce', 'NetSuite', 'PBM Platforms', 'Pharmacy Claims Systems', 'REST APIs'],
      ['React', 'Node.js', 'Three.js', 'JavaScript', 'HTML / CSS'],
    ],
  },
}

/* ── Sub-components ── */
function TimelineItem({ item }) {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()
  return (
    <div className={`resume-tl-item${open ? ' open' : ''}`}>
      <div className="resume-tl-line-wrap">
        <div className="resume-tl-dot" style={{ background: item.color, boxShadow: `0 0 12px ${item.color}66` }} />
        <div className="resume-tl-line" />
      </div>
      <div className="resume-tl-body">
        <button className="resume-tl-header" onClick={() => setOpen(v => !v)} type="button">
          <div className="resume-tl-header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span className="resume-tl-type" style={{ color: item.color, borderColor: `${item.color}40`, background: `${item.color}12` }}>
                {item.type}
              </span>
              {item.current && (
                <span className="resume-tl-current-badge">{t('resumeCard.current')}</span>
              )}
            </div>
            <h4 className="resume-tl-role">{item.role}</h4>
            <span className="resume-tl-company">{item.company}</span>
            <p className="resume-tl-summary">{item.summary}</p>
          </div>
          <div className="resume-tl-right">
            <span className="resume-tl-period">{item.period}</span>
            <svg className={`resume-tl-arrow${open ? ' rotated' : ''}`} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </button>
        {open && (
          <ul className="resume-tl-details">
            {item.details.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}

function EngagementItem({ eng }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`resume-eng-item resume-eng-tool${open ? ' open' : ''}`}
      style={{ borderLeftColor: open ? eng.color : `${eng.color}33` }}>
      <button className="resume-eng-toggle" onClick={() => setOpen(v => !v)} type="button">
        <div className="resume-eng-toggle-left">
          <span className="resume-eng-icon-wrap" style={{ color: eng.color, background: `${eng.color}14`, borderColor: `${eng.color}30` }}>
            {eng.icon}
          </span>
          <div>
            <span className="resume-eng-tag" style={{ color: eng.color, borderColor: `${eng.color}40`, background: `${eng.color}12` }}>
              {eng.tool}
            </span>
            <h3 className="resume-eng-title">{eng.title}</h3>
            <span className="resume-eng-company">{eng.context}</span>
          </div>
        </div>
        <svg className={`resume-tl-arrow${open ? ' rotated' : ''}`} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <ul className="resume-eng-bullets">
          {eng.highlights.map((h, j) => <li key={j}>{h}</li>)}
        </ul>
      )}
    </div>
  )
}

/* ── Main Component ── */
export default function ResumeCard({ industry }) {
  const meta = RESUME_META[industry] || RESUME_META['Data Engineering']
  const { t } = useLanguage()
  const [imgError, setImgError] = useState(false)

  const rd = t('resumeData')
  const data = {
    ...meta,
    title:   rd.jobTitle,
    summary: rd.summary,
    skills:  meta.skillItems.map((items, i) => ({ category: rd.skillCategories[i], items })),
  }
  const TIMELINE = TIMELINE_META.map((m, i) => ({
    ...m,
    role:    rd.timeline[i].role,
    type:    rd.timeline[i].type,
    summary: rd.timeline[i].summary,
    details: rd.timeline[i].details,
  }))
  const engagements = ENGAGEMENT_COLORS.map((color, i) => ({
    color,
    tool:       ENGAGEMENT_TOOLS[i],
    icon:       ENGAGEMENT_ICONS[i],
    title:      rd.engagements[i].title,
    context:    rd.engagements[i].context,
    highlights: rd.engagements[i].highlights,
  }))

  return (
    <div className="resume-card">

      {/* HEADER */}
      <div className="resume-header">
        <div className="resume-photo-wrap">
          {!imgError ? (
            <img
              className="resume-photo"
              src="/assets/yannick.jpg"
              alt={data.name}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="resume-avatar">{data.name.charAt(0)}</div>
          )}
        </div>
        <div className="resume-header-info">
          <h1 className="resume-name">{data.name}</h1>
          <p className="resume-title">{data.title}</p>
          <div className="resume-meta">
            <span className="resume-meta-item">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <a href={`mailto:${data.email}`}>{data.email}</a>
            </span>
            <span className="resume-meta-item">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
              </svg>
              <a href={`https://${data.website}`} target="_blank" rel="noopener noreferrer">{data.website}</a>
            </span>
            <span className="resume-meta-item">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {data.location}
            </span>
          </div>
        </div>
        <button
          className="resume-print-btn no-print"
          title={t('resumeCard.requestPdf')}
          onClick={() => {
            const subject = encodeURIComponent('PDF Resume Request \u2014 Data Engineering')
            const body = encodeURIComponent(
              'Hello,\n\nI would like to request a PDF version of Yannick Nkongolo\'s Data Engineering resume.\n\nBest regards,'
            )
            window.open(`mailto:yannicknkongolo7@gmail.com?subject=${subject}&body=${body}`)
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          {t('resumeCard.requestPdf')}
        </button>
      </div>

      {/* SUMMARY */}
      <div className="resume-section">
        <h2 className="resume-section-title">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          {t('resumeCard.professionalSummary')}
        </h2>
        <p className="resume-summary">{data.summary}</p>
      </div>

      {/* EDUCATION & CERTIFICATIONS */}
      {data.education && (
        <div className="resume-section">
          <h2 className="resume-section-title">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2.21 2.686 4 6 4s6-1.79 6-4v-5"/>
            </svg>
            {t('resumeCard.educationCertifications')}
          </h2>
          <div className="resume-edu-grid">
            {data.education.map((e, i) => (
              <div className="resume-edu-item" key={i}>
                <span className="resume-edu-degree">{e.degree}</span>
                <span className="resume-edu-field">{e.field}</span>
                {e.school && <span className="resume-edu-school">{e.school}</span>}
                {e.year && (
                  <span className="resume-edu-year">
                    {e.year}{e.expected && <em> ({t('resumeCard.expected')})</em>}
                  </span>
                )}
              </div>
            ))}
          </div>
          {data.certifications && (
            <div className="resume-cert-list">
              {data.certifications.map((c, i) => (
                <span className="resume-cert-badge" key={i}>{c}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CAREER TIMELINE */}
      <div className="resume-section">
        <h2 className="resume-section-title">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {t('resumeCard.careerTimeline')}
        </h2>
        <p className="resume-tl-hint no-print">{t('resumeCard.timelineHint')}</p>
        <div className="resume-timeline">
          {TIMELINE.slice(1).map((item, i) => <TimelineItem key={i} item={item} />)}
        </div>
      </div>

      {/* CORE COMPETENCIES */}
      <div className="resume-section">
        <h2 className="resume-section-title">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          {t('resumeCard.coreCompetencies')}
        </h2>
        <div className="resume-skills-grid">
          {data.skills.map((group) => (
            <div className="resume-skills-group" key={group.category}>
              <span className="resume-skill-cat">{group.category}</span>
              <div className="resume-skill-tags">
                {group.items.map((s) => (
                  <span className="resume-skill-tag" key={s}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOOL-DRIVEN ENGAGEMENTS */}
      <div className="resume-section">
        <h2 className="resume-section-title">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
          </svg>
          {t('resumeCard.toolEngagements')}
        </h2>
        <p className="resume-tl-hint no-print">{t('resumeCard.engagementsHint')}</p>
        <div className="resume-eng-list">
          {engagements.map((eng, i) => (
            <EngagementItem key={i} eng={eng} />
          ))}
        </div>
      </div>

      {/* ENTREPRENEURSHIP */}
      <div className="resume-section">
        <h2 className="resume-section-title">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          {t('resumeCard.entrepreneurship')}
        </h2>
        <div className="resume-timeline">
          <TimelineItem item={TIMELINE[0]} />
        </div>
      </div>

      {/* FOOTER */}
      <p className="resume-footer-note">
        {t('resumeCard.footerNote')} &middot; {data.website}
      </p>
    </div>
  )
}
