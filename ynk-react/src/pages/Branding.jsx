import { Link } from 'react-router-dom'
import QuoteForm from '../components/QuoteForm'

const BRANDING_SERVICES = [
  'Event Technicians',
  'Stage Lighting & Rental',
  'Custom T-Shirt Printing',
  'Brand Strategy & Identity Design',
  'Event & Visual Branding',
  'Content Positioning & Visual Storytelling',
]

export default function Branding() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">02</span>
          <h1 className="section-title">Branding &amp; Creative Services</h1>
          <p className="section-subtitle">Precision execution for impactful brand experiences</p>
        </div>
      </section>

      <section className="detail-section">
        <div className="container">
          <div className="detail-grid detail-grid--3">
            <div className="detail-card" data-aos="">
              <div className="detail-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3>Event Technicians</h3>
              <p>Skilled professionals ensuring flawless event operations from setup to teardown.</p>
            </div>
            <div className="detail-card" data-aos="">
              <div className="detail-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3>Stage Lighting &amp; Rental</h3>
              <p>Professional lighting setups that elevate your event atmosphere and captivate audiences.</p>
            </div>
            <div className="detail-card" data-aos="">
              <div className="detail-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <h3>Custom T-Shirt Printing</h3>
              <p>High-quality branded apparel for events, promotions, and team building.</p>
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
            <h2 className="cta-title">Request a Free Branding Quote</h2>
            <p className="cta-text">Tell us about your branding needs and we'll get back to you within 24 hours.</p>
          </div>
          <QuoteForm serviceOptions={BRANDING_SERVICES} />
        </div>
      </section>
    </>
  )
}
