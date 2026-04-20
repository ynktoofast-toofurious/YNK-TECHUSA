const RESUME = {
  'Data Engineering': {
    name: 'Yannick Nkongolo',
    title: 'Data Engineer & Analytics Consultant',
    location: 'United States',
    email: 'yannicknkongolo7@gmail.com',
    website: 'ynk-techusa.com',
    summary:
      'Results-driven Data Engineer and Analytics Consultant with deep expertise in Snowflake, dbt, Power BI, and cloud-native data architectures. Proven track record delivering high-impact solutions across healthcare, pharmacy, finance, and manufacturing — processing billions of rows and powering executive-level analytics at scale.',
    skills: [
      { category: 'Data Engineering', items: ['Snowflake', 'dbt', 'Python', 'SQL', 'ETL / ELT Pipelines', 'Alteryx'] },
      { category: 'Analytics & BI', items: ['Power BI', 'DAX', 'DirectQuery', 'Power BI Service', 'Row-Level Security', 'Dataflows'] },
      { category: 'Cloud & Infrastructure', items: ['AWS S3', 'AWS Lambda', 'API Gateway', 'Azure', 'GitHub Actions', 'CI/CD'] },
      { category: 'Data Integration', items: ['Salesforce', 'NetSuite', 'PBM Platforms', 'REST APIs', 'Pharmacy Claims Systems'] },
      { category: 'Development', items: ['React', 'Node.js', 'Three.js', 'JavaScript', 'HTML / CSS'] },
    ],
    engagements: [
      {
        tag: 'Data Engineering',
        title: '4B-Row Pharmacy Reporting Layer',
        company: 'Healthcare Analytics Client',
        highlights: [
          'Engineered a Snowflake + dbt reporting layer processing over 4 billion rows of pharmacy claims',
          'Enabled real-time decision-making across 4,000+ health plan clients via Power BI Embedded',
          'Architected modular dbt models with full lineage documentation and incremental load strategies',
        ],
      },
      {
        tag: 'Analytics Modernization',
        title: 'Power BI Service Enablement',
        company: 'Pharmacy Analytics Division',
        highlights: [
          'Led full Power BI Service deployment — workspace governance, deployment pipelines, and dataflow architecture',
          'Delivered 40+ executive-level dashboards with governance standards and refresh automation',
          'Established DirectQuery and Import mode strategy across reporting tiers',
        ],
      },
      {
        tag: 'Healthcare Analytics',
        title: 'Utilization Management Dashboard',
        company: 'Health Plan Client',
        highlights: [
          'Delivered PMPM, formulary savings, and drug utilization dashboard suite',
          'Implemented multi-layer Row-Level Security (RLS) protecting PHI/PII for healthcare compliance',
          'Integrated Alteryx workflows for upstream data transformation and validation',
        ],
      },
      {
        tag: 'Industrial Engineering',
        title: 'Manufacturing BI & Lean Analysis',
        company: 'Manufacturing Client',
        highlights: [
          'Built self-service analytics portals and Alteryx workflows for operational insights',
          'Combined AutoCAD layout analyses to optimize lean production flow and capacity planning',
          'Delivered dashboards enabling plant managers to monitor KPIs in real time',
        ],
      },
      {
        tag: 'Data Integration',
        title: 'Multi-Source Data Pipeline',
        company: 'Enterprise Client',
        highlights: [
          'Designed and implemented integrations from NetSuite, Salesforce, PBM platforms, and pharmacy claims systems',
          'Centralized data governance and improved cross-system reporting accuracy',
          'Automated reconciliation workflows reducing manual effort by over 60%',
        ],
      },
      {
        tag: 'Platform Engineering',
        title: 'YNK-Tech USA Web Platform',
        company: 'YNK-Tech USA (Internal)',
        highlights: [
          'Architected and deployed the full YNK-Tech USA platform — React SPA, Three.js 3D AI visualization, multilingual i18n',
          'Integrated AWS S3 hosting, Lambda API, API Gateway, and a custom admin dashboard',
          'Implemented access-code gating with SHA-256 hashing, EmailJS, and geolocation tracking',
        ],
      },
    ],
  },
}

export default function ResumeCard({ industry }) {
  const data = RESUME[industry] || RESUME['Data Engineering']

  const handlePrint = () => window.print()

  return (
    <div className="resume-card">
      {/* ── HEADER ── */}
      <div className="resume-header">
        <div className="resume-avatar">{data.name.charAt(0)}</div>
        <div className="resume-header-info">
          <h1 className="resume-name">{data.name}</h1>
          <p className="resume-title">{data.title}</p>
          <div className="resume-meta">
            <span className="resume-meta-item">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <a href={`mailto:${data.email}`}>{data.email}</a>
            </span>
            <span className="resume-meta-item">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
              <a href={`https://${data.website}`} target="_blank" rel="noopener noreferrer">{data.website}</a>
            </span>
            <span className="resume-meta-item">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {data.location}
            </span>
          </div>
        </div>
        <button className="resume-print-btn no-print" onClick={handlePrint} title="Print resume">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print
        </button>
      </div>

      {/* ── SUMMARY ── */}
      <div className="resume-section">
        <h2 className="resume-section-title">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          Professional Summary
        </h2>
        <p className="resume-summary">{data.summary}</p>
      </div>

      {/* ── SKILLS ── */}
      <div className="resume-section">
        <h2 className="resume-section-title">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
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

      {/* ── ENGAGEMENTS ── */}
      <div className="resume-section">
        <h2 className="resume-section-title">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
          Key Engagements
        </h2>
        <div className="resume-eng-list">
          {data.engagements.map((eng, i) => (
            <div className="resume-eng-item" key={i}>
              <div className="resume-eng-header">
                <span className="resume-eng-tag">{eng.tag}</span>
                <div className="resume-eng-title-row">
                  <h3 className="resume-eng-title">{eng.title}</h3>
                  <span className="resume-eng-company">{eng.company}</span>
                </div>
              </div>
              <ul className="resume-eng-bullets">
                {eng.highlights.map((h, j) => (
                  <li key={j}>{h}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER NOTE ── */}
      <p className="resume-footer-note">
        References and full work history available upon request &middot; {data.website}
      </p>
    </div>
  )
}
