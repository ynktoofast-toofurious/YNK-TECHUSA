import { Link } from 'react-router-dom'
import QuoteForm from '../components/QuoteForm'

const IT_SERVICES = [
  'Website & Web App Development',
  'AI Enablement & Automation',
  'Big Data Engineering & Analytics',
  'Cloud & Infrastructure Setup',
  'Dashboard & BI Development',
  'Machine Learning & Predictive Models',
]

export default function ITServices() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">01</span>
          <h1 className="section-title">IT Services &amp; Digital Solutions</h1>
          <p className="section-subtitle">Smart technology to scale your business</p>
        </div>
      </section>

      <section className="detail-section">
        <div className="container">
          <div className="detail-grid">
            <div className="detail-card" data-aos="">
              <div className="detail-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </div>
              <h3>Website Development</h3>
              <p>Modern, responsive, performance-optimized websites built to convert visitors into customers.</p>
            </div>
            <div className="detail-card" data-aos="">
              <div className="detail-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3>AI Enablement</h3>
              <p>Automate processes and unlock smarter decision-making with cutting-edge artificial intelligence.</p>
            </div>
            <div className="detail-card" data-aos="">
              <div className="detail-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
              </div>
              <h3>Big Data Engineering</h3>
              <p>Scalable data pipelines and powerful dashboards that transform raw data into actionable insights.</p>
            </div>
            <div className="detail-card" data-aos="">
              <div className="detail-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
              </div>
              <h3>Machine Learning</h3>
              <p>Predict trends, optimize operations, and gain a competitive edge with custom ML models.</p>
            </div>
          </div>
          <div className="detail-action">
            <Link to="/" className="btn btn-secondary">← Back to Home</Link>
          </div>
        </div>
      </section>

      <section className="cta-section" id="quote">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Request a Free IT Services Quote</h2>
            <p className="cta-text">Tell us about your project and we'll get back to you within 24 hours.</p>
          </div>
          <QuoteForm serviceOptions={IT_SERVICES} />
        </div>
      </section>
    </>
  )
}
