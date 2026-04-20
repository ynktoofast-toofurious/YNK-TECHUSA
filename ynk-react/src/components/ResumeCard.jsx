import { useState } from 'react'

/* ── Career Timeline ── */
const TIMELINE = [
  {
    period: '2024 - Present',
    role: 'Founder & Principal Consultant',
    company: 'YNK-Tech USA',
    type: 'Entrepreneurship',
    color: '#29B5E8',
    summary: 'Founded and scaled a multi-service technology platform combining IT consulting, brand strategy, and a gated consultants portal.',
    details: [
      'Architected and deployed the full YNK-Tech USA platform: React SPA, Three.js 3D AI visualization, multilingual i18n (EN/FR/ES)',
      'Built a gated consultant portal with SHA-256 access codes, EmailJS notifications, and geolocation analytics',
      'Integrated AWS S3 hosting, Lambda API endpoints, API Gateway, and a custom admin dashboard',
      'Designed and shipped a full visual brand system including logo, color system, and multi-service identity',
    ],
  },
  {
    period: '2022 - 2024',
    role: 'Senior Data Engineer',
    company: 'Healthcare & Pharmacy Analytics',
    type: 'Data Engineering',
    color: '#10b981',
    summary: 'Led data engineering and analytics initiatives for large-scale pharmacy benefit management (PBM) platforms serving health plans nationwide.',
    details: [
      'Engineered a Snowflake + dbt reporting layer processing over 4 billion rows of pharmacy claims',
      'Led Power BI Service deployment: workspace governance, deployment pipelines, and dataflow architecture across 40+ executive dashboards',
      'Delivered PMPM, formulary savings, and drug utilization dashboard suite with multi-layer Row-Level Security (RLS)',
      'Integrated Alteryx workflows for upstream data transformation, validation, and reconciliation',
    ],
  },
  {
    period: '2020 - 2022',
    role: 'Analytics Engineer',
    company: 'Manufacturing & Enterprise Clients',
    type: 'BI & Analytics',
    color: '#f59e0b',
    summary: 'Delivered self-service analytics and operational intelligence solutions for manufacturing and multi-source enterprise environments.',
    details: [
      'Built self-service Power BI portals and Alteryx workflows for lean production analytics and capacity planning',
      'Combined AutoCAD layout analyses to optimize production floor operations and throughput',
      'Designed and implemented multi-source data pipelines integrating NetSuite, Salesforce, and PBM systems',
      'Automated cross-system reconciliation workflows, reducing manual effort by over 60%',
    ],
  },
  {
    period: '2018 - 2020',
    role: 'Business Intelligence Developer',
    company: 'Enterprise Analytics',
    type: 'BI Development',
    color: '#8b5cf6',
    summary: 'Developed business intelligence solutions across finance, retail, and operations, laying the foundation for advanced data engineering work.',
    details: [
      'Built SQL-based reporting layers and executive-facing dashboards for operational and financial KPIs',
      'Developed ETL pipelines and data transformation workflows using SQL, Python, and proprietary tooling',
      'Collaborated with cross-functional teams to translate business requirements into data models',
      'Implemented data quality monitoring and automated alerting for pipeline health',
    ],
  },
]

/* ── Resume Data ── */
const RESUME = {
  'Data Engineering': {
    name: 'Yannick Nkongolo',
    title: 'Data Engineer & Analytics Consultant',
    location: 'United States',
    email: 'yannicknkongolo7@gmail.com',
    website: 'ynk-techusa.com',
    summary:
      'Results-driven Data Engineer and Analytics Consultant with deep expertise in Snowflake, dbt, Power BI, and cloud-native data architectures. Proven track record delivering high-impact solutions across healthcare, pharmacy, finance, and manufacturing, processing billions of rows and powering executive-level analytics at scale.',
    skills: [
      { category: 'Data Engineering', items: ['Snowflake', 'dbt', 'Python', 'SQL', 'ETL / ELT Pipelines', 'Alteryx'] },
      { category: 'Analytics & BI', items: ['Power BI', 'DAX', 'DirectQuery', 'Power BI Service', 'Row-Level Security', 'Dataflows'] },
      { category: 'Cloud & Infrastructure', items: ['AWS S3', 'AWS Lambda', 'API Gateway', 'Azure', 'GitHub Actions', 'CI/CD'] },
      { category: 'Data Integration', items: ['Salesforce', 'NetSuite', 'PBM Platforms', 'REST APIs', 'Pharmacy Claims Systems'] },
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
            <span className="resume-tl-type" style={{ color: item.color, borderColor: `${item.color}40`, background: `${item.color}12` }}>
              {item.type}
            </span>
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
        <button className="resume-print-btn no-print" onClick={() => window.print()} title="Print resume">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print
        </button>
      </div>

      {/* SUMMARY */}
      <div className="resume-section">
        <h2 className="resume-section-title">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          Professional Summary
        </h2>
        <p className="resume-summary">{data.summary}</p>
      </div>

      {/* CAREER TIMELINE */}
      <div className="resume-section">
        <h2 className="resume-section-title">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Career Timeline
        </h2>
        <p className="resume-tl-hint no-print">Click any role to expand full details</p>
        <div className="resume-timeline">
          {TIMELINE.map((item, i) => <TimelineItem key={i} item={item} />)}
        </div>
      </div>

      {/* CORE COMPETENCIES */}
      <div className="resume-section">
        <h2 className="resume-section-title">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Core Competencies
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
          Tool-Driven Engagements
        </h2>
        <p className="resume-tl-hint no-print">Click any engagement to expand highlights</p>
        <div className="resume-eng-list">
          {data.engagements.map((eng, i) => (
            <EngagementItem key={i} eng={eng} />
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <p className="resume-footer-note">
        References and full work history available upon request &middot; {data.website}
      </p>
    </div>
  )
}
