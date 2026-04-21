import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

/* ── Career Timeline ── */
const TIMELINE = [
  {
    period: '2024 - Present',
    role: 'Founder & Principal Consultant',
    company: 'YNK-Tech USA',
    type: 'Entrepreneurship',
    color: '#29B5E8',
    current: false,
    summary: 'Founded and scaled a multi-service technology platform combining IT consulting, brand strategy, and a gated consultants portal.',
    details: [
      'Architected and deployed the full YNK-Tech USA platform: React SPA, Three.js 3D AI visualization, multilingual i18n (EN/FR/ES)',
      'Built a gated consultant portal with SHA-256 access codes, EmailJS notifications, and geolocation analytics',
      'Integrated AWS S3 hosting, Lambda API endpoints, API Gateway, and a custom admin dashboard',
      'Designed and shipped a full visual brand system including logo, color system, and multi-service identity',
    ],
  },
  {
    period: '2022 - Present',
    role: 'Sr. Data Engineer / Power BI Engineer',
    company: 'OptumRx \u2013 UnitedHealth Group',
    type: 'Data Engineering',
    color: '#10b981',
    current: true,
    summary: 'Leading pharmacy analytics and data engineering initiatives for one of the nation\'s largest pharmacy benefit managers, serving 4,000+ health plan clients.',
    details: [
      'Leading pharmacy analytics in Power BI: Utilization Management dashboards tracking formularies, savings, and PMPM metrics for 4,000+ clients using Snowflake DirectQuery',
      'Developed advanced Power BI solutions with complex DAX and dynamic Row-Level Security at client, drug, and rebate levels, ensuring strict PHI/PII protection',
      'Engineered scalable data models and integrations from NetSuite, Salesforce, pharmacy claims, and PBM platforms, improving data governance and reporting reliability',
      'Delivered financial analysis dashboards tracking cost management, formulary savings, PMPM trends, and operational performance for health plan executives',
      'Partnered with pharmacy operations, clinical teams, and offshore stakeholders to define KPIs, document business logic, and align analytics with regulatory priorities',
      'Ensured reporting integrity through rigorous data quality audits and reconciliation with source-of-truth systems aligned with healthcare reporting standards',
    ],
  },
  {
    period: '2019 - 2022',
    role: 'Industrial Engineer / BI Developer',
    company: 'Group O',
    type: 'BI & Analytics',
    color: '#f59e0b',
    current: false,
    summary: 'Delivered self-service analytics, operational intelligence, and lean production insights for manufacturing and multi-source enterprise environments.',
    details: [
      'Created and maintained dashboards and automated Alteryx workflows to simplify data access for decision-makers',
      'Designed reporting formats and end-user information portals, enabling self-service analytics across operational teams',
      'Conducted cause-and-effect analyses to uncover operational bottlenecks and recommend data-driven improvements',
      'Performed AutoCAD layout analyses to optimize lean production flow, enhance ergonomics, and adjust capacity',
      'Integrated and validated data from multiple systems, ensuring alignment with business objectives',
      'Conducted time studies for single-unit processes, individual workflows, and production line processes',
    ],
  },
  {
    period: '2016 - 2019',
    role: 'Power BI Developer',
    company: 'S&B Industry',
    type: 'BI Development',
    color: '#8b5cf6',
    current: false,
    summary: 'Built data-driven reporting solutions and automated analytics workflows supporting operational impact assessments and trend analysis.',
    details: [
      'Produced data-driven reports using Alteryx, facilitating operational impact assessments and trend analysis',
      'Automated routine reporting processes to enhance efficiency and accuracy across business units',
      'Supported stakeholders by creating custom datasets and maintaining report specifications',
      'Collaborated with cross-functional teams to define and implement data quality improvements',
    ],
  },
  {
    period: '2015 - 2016',
    role: 'BI Developer',
    company: 'SMS',
    type: 'BI Development',
    color: '#e879f9',
    current: false,
    summary: 'Developed and maintained data pipelines supporting business reporting and provided actionable insights through data interpretation.',
    details: [
      'Developed and maintained data pipelines to support business reporting needs',
      'Conducted quality checks and ensured accuracy of all reporting deliverables',
      'Provided actionable insights by interpreting data and delivering clear recommendations to stakeholders',
    ],
  },
]

/* ── Resume Data ── */
const RESUME = {
  'Data Engineering': {
    name: 'Yannick Nkongolo',
    title: 'Sr. Data Engineer & Analytics Consultant | Power BI SME',
    location: 'Fort Worth, TX',
    email: 'yannicknkongolo7@gmail.com',
    website: 'ynk-techusa.com',
    summary:
      'Power BI and Data Analytics Subject Matter Expert with 10+ years designing scalable data structures and engineering analytics solutions. Deep expertise in DAX, advanced M (Power Query), Snowflake, and large-scale data modeling. Proven record transforming complex pharmacy, financial, and operational data into executive-level insights. Currently leading pharmacy analytics at OptumRx (UHG) while running YNK-Tech USA as Founder.',
    education: [
      { degree: 'Master of Science', field: 'Data Analytics \u2013 Data Engineering', school: '' },
      { degree: 'Bachelor of Science', field: 'Data Analytics', school: '' },
    ],
    certifications: ['Power Platform Certified (PL-900)', 'Alteryx Core Certificate', 'ServiceNow Certified'],
    skills: [
      { category: 'Analytics & BI', items: ['Power BI', 'DAX', 'M / Power Query', 'DirectQuery', 'Composite Models', 'Row-Level Security', 'Dataflows', 'Tableau'] },
      { category: 'Data Engineering', items: ['Snowflake', 'dbt', 'Python', 'SQL', 'ETL / ELT Pipelines', 'Alteryx', 'Data Modeling'] },
      { category: 'Financial Analytics', items: ['PMPM Metrics', 'Formulary Savings', 'Cost Management', 'Budget vs. Actuals', 'Operational KPIs', 'Drug Utilization'] },
      { category: 'Cloud & Infrastructure', items: ['AWS S3', 'AWS Lambda', 'API Gateway', 'Azure', 'GitHub Actions', 'CI/CD'] },
      { category: 'Data Integration', items: ['Salesforce', 'NetSuite', 'PBM Platforms', 'Pharmacy Claims Systems', 'REST APIs'] },
      { category: 'Development', items: ['React', 'Node.js', 'Three.js', 'JavaScript', 'HTML / CSS'] },
    ],
    engagements: [
      {
        tool: 'Snowflake',
        title: 'Data Engineering using Snowflake',
        context: 'Healthcare & Pharmacy Analytics',
        color: '#29B5E8',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        ),
        highlights: [
          'Engineered a Snowflake reporting layer processing over 4 billion rows of pharmacy claims from multiple PBM data sources',
          'Designed star and snowflake schemas optimized for DirectQuery and incremental load performance',
          'Implemented clustering keys, result caches, and virtual warehouse auto-scaling to control compute costs',
          'Enabled real-time decision-making for 4,000+ health plan clients via Power BI Embedded against Snowflake',
        ],
      },
      {
        tool: 'Power BI',
        title: 'Data Engineering using Power BI',
        context: 'Pharmacy Analytics Division',
        color: '#f2c811',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
        ),
        highlights: [
          'Led full Power BI Service deployment including workspace governance and deployment pipeline architecture',
          'Delivered 40+ executive-level dashboards with DirectQuery, Import, and Composite model strategies',
          'Implemented multi-layer Row-Level Security (RLS) protecting PHI/PII across 4,000+ client health plans',
          'Built automated dataflows, refresh scheduling, and incremental refresh policies at enterprise scale',
        ],
      },
      {
        tool: 'Git & VS Code',
        title: 'Data Engineering using Git and VS Code',
        context: 'YNK-Tech USA & Enterprise Projects',
        color: '#f05033',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
            <path d="M6 9v6M15.5 5.5L8.5 12.5"/>
          </svg>
        ),
        highlights: [
          'Managed full CI/CD pipelines via GitHub Actions for both the YNK-Tech USA platform and dbt project deployments',
          'Version-controlled all dbt models, SQL transformations, and pipeline configurations across team environments',
          'Used VS Code extensions (dbt Power User, SQLTools, Snowflake connector) as the core engineering workbench',
          'Maintained branching strategy, PR reviews, and environment promotion (dev/staging/prod) across all projects',
        ],
      },
      {
        tool: 'dbt',
        title: 'Data Engineering engaging dbt',
        context: 'Snowflake Data Warehouse Layer',
        color: '#ff6849',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        ),
        highlights: [
          'Architected modular dbt project structure with staging, intermediate, and mart layers following best practices',
          'Built full lineage documentation with dbt docs, enabling cross-team data discovery and trust',
          'Implemented incremental models, snapshot tables, and source freshness checks for pipeline reliability',
          'Wrote reusable macros, generic tests, and Jinja-based logic reducing model duplication by over 70%',
        ],
      },
      {
        tool: 'Prompt & LLMs',
        title: 'Data Engineering using Prompt and LLMs',
        context: 'AI-Assisted Engineering Workflows',
        color: '#10b981',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        ),
        highlights: [
          'Leveraged LLMs (GPT-4, Claude) as engineering co-pilots for SQL generation, dbt model scaffolding, and code review',
          'Built prompt workflows to automate documentation of data dictionaries, lineage descriptions, and test generation',
          'Designed the YNK AI Concierge chatbot with context-aware responses using structured prompt engineering',
          'Researched and applied LLM-based anomaly detection patterns for pipeline health monitoring use cases',
        ],
      },
    ],
  },
}

/* ── Sub-components ── */
function TimelineItem({ item }) {
  const [open, setOpen] = useState(false)
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
                <span className="resume-tl-current-badge">Current</span>
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
  const data = RESUME[industry] || RESUME['Data Engineering']
  const { t } = useLanguage()
  const [imgError, setImgError] = useState(false)

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
          {data.engagements.map((eng, i) => (
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
