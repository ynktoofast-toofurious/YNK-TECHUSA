import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import emailjs from '@emailjs/browser'

const SERVICE_OPTIONS = [
  'Website Development',
  'AI Enablement & Automation',
  'Big Data Engineering & Analytics',
  'Cloud & Infrastructure Setup',
  'Dashboard & BI Development',
  'Brand Strategy & Identity Design',
  'Event Technicians',
  'Stage Lighting & Rental',
  'Custom T-Shirt Printing',
  'Other',
]

const BUDGET_OPTIONS = [
  'Under $1,000',
  '$1,000 – $5,000',
  '$5,000 – $10,000',
  '$10,000 – $25,000',
  '$25,000+',
  'Not sure yet',
]

const TIMELINE_OPTIONS = [
  'ASAP',
  '1 – 2 weeks',
  '1 month',
  '2 – 3 months',
  'Flexible',
]

export default function RequestQuote() {
  const formRef = useRef()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError('')

    try {
      // EmailJS: Replace these IDs with your actual EmailJS service, template, and public key
      // Sign up at https://www.emailjs.com/ and create:
      // 1. An email service connected to yannicknkongolo7@gmail.com
      // 2. A template with variables: {{from_name}}, {{from_email}}, {{phone}}, {{company}}, {{service}}, {{budget}}, {{timeline}}, {{message}}
      // 3. Get your public key from Account > API Keys
      await emailjs.sendForm(
        'service_sw3zais',
        'template_8yj65yj',
        formRef.current,
        'zG_jERVPbUUfiZ6IL'
      )
      setSent(true)
    } catch (err) {
      setError('Failed to send your request. Please try again or email us directly at yannicknkongolo7@gmail.com')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <>
        <section className="page-hero">
          <div className="container">
            <span className="section-tag">Free Quote</span>
            <h1 className="section-title">Request a Free Quote</h1>
            <p className="section-subtitle">Tell us about your project</p>
          </div>
        </section>
        <section className="detail-section">
          <div className="container">
            <div className="quote-success">
              <div className="quote-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="64" height="64">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2>Free Quote Request Sent!</h2>
              <p>Thank you for reaching out. We'll review your request and get back to you within 24 hours.</p>
              <div className="cta-buttons" style={{ marginTop: '32px' }}>
                <Link to="/" className="btn btn-primary">Back to Home</Link>
                <a href="https://calendly.com/yannicknkongolo7/30min" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Book a Consultation</a>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">Free Quote</span>
          <h1 className="section-title">Request a Free Quote</h1>
          <p className="section-subtitle">Tell us about your project and we'll get back to you within 24 hours</p>
        </div>
      </section>

      <section className="detail-section">
        <div className="container">
          <div className="quote-layout">
            {/* Left: Form */}
            <form ref={formRef} className="quote-form" onSubmit={handleSubmit}>
              <div className="quote-form-grid">
                {/* Name */}
                <div className="form-group">
                  <label htmlFor="from_name">Full Name <span className="required">*</span></label>
                  <input type="text" id="from_name" name="from_name" required placeholder="John Doe" />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="from_email">Email Address <span className="required">*</span></label>
                  <input type="email" id="from_email" name="from_email" required placeholder="john@example.com" />
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" placeholder="+1 (555) 000-0000" />
                </div>

                {/* Company */}
                <div className="form-group">
                  <label htmlFor="company">Company / Organization</label>
                  <input type="text" id="company" name="company" placeholder="Acme Inc." />
                </div>

                {/* Service */}
                <div className="form-group form-group--full">
                  <label htmlFor="service">Service Needed <span className="required">*</span></label>
                  <select id="service" name="service" required defaultValue="">
                    <option value="" disabled>Select a service</option>
                    {SERVICE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Budget */}
                <div className="form-group">
                  <label htmlFor="budget">Budget Range</label>
                  <select id="budget" name="budget" defaultValue="">
                    <option value="" disabled>Select budget</option>
                    {BUDGET_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Timeline */}
                <div className="form-group">
                  <label htmlFor="timeline">Timeline</label>
                  <select id="timeline" name="timeline" defaultValue="">
                    <option value="" disabled>Select timeline</option>
                    {TIMELINE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div className="form-group form-group--full">
                  <label htmlFor="message">Project Details <span className="required">*</span></label>
                  <textarea id="message" name="message" required rows="6" placeholder="Describe your project, goals, and any specific requirements..."></textarea>
                </div>
              </div>

              {error && <div className="quote-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg" disabled={sending} style={{ width: '100%', marginTop: '8px' }}>
                {sending ? (
                  <>
                    <span className="btn-spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Submit Free Quote Request'
                )}
              </button>
            </form>

            {/* Right: Info sidebar */}
            <div className="quote-sidebar">
              <div className="quote-info-card">
                <h3>What Happens Next?</h3>
                <div className="quote-steps">
                  <div className="quote-step">
                    <div className="quote-step-num">1</div>
                    <div>
                      <strong>We Review</strong>
                      <p>Our team reviews your project requirements within 24 hours.</p>
                    </div>
                  </div>
                  <div className="quote-step">
                    <div className="quote-step-num">2</div>
                    <div>
                      <strong>We Connect</strong>
                      <p>We schedule a discovery call to discuss details and scope.</p>
                    </div>
                  </div>
                  <div className="quote-step">
                    <div className="quote-step-num">3</div>
                    <div>
                      <strong>We Deliver</strong>
                      <p>You receive a detailed proposal with timeline and pricing.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="quote-info-card">
                <h3>Prefer to Talk?</h3>
                <p>Book a free 30-minute consultation call to discuss your project directly.</p>
                <a href="https://calendly.com/yannicknkongolo7/30min" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: '100%', marginTop: '16px' }}>
                  Book a Consultation
                </a>
              </div>

              <div className="quote-info-card">
                <h3>Direct Contact</h3>
                <p className="quote-contact-email">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <a href="mailto:yannicknkongolo7@gmail.com">yannicknkongolo7@gmail.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
