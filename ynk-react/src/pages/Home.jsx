import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import emailjs from '@emailjs/browser'

emailjs.init('zG_jERVPbUUfiZ6IL')

export default function Home() {
  const formRef = useRef()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')

  const handleQuoteSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setFormError('')
    try {
      await emailjs.sendForm(
        'service_sw3zais',
        'template_8yj65yj',
        formRef.current
      )
      setSent(true)
    } catch (err) {
      console.error('EmailJS error:', err)
      setFormError(`Failed to send: ${err?.text || err?.message || 'Unknown error'}. Please email us directly at yannicknkongolo7@gmail.com`)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    // Scroll reveal
    const elements = document.querySelectorAll('[data-aos]')
    if (!elements.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('aos-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    elements.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 0.1}s`
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-content">
          <h1 className="hero-headline">
            <span className="hero-line">Technology</span>
            <span className="hero-line">Meets</span>
            <span className="hero-line"><span className="text-gradient">Vision</span></span>
          </h1>
          <p className="hero-subtext">IT Solutions · Branding · Portfolio</p>
          <div className="hero-scroll-cue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </div>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className="intro-section" id="intro">
        <div className="container">
          <div className="intro-header" data-aos="">
            <span className="section-tag">Who We Are</span>
            <h2 className="section-title">At the Intersection of Technology, Creativity &amp; Data</h2>
            <p className="intro-lead">I provide end-to-end solutions that empower individuals and organizations to build, scale, and stand out.</p>
            <p className="intro-text">This platform is designed as a multi-service hub combining <strong>IT Services</strong>, <strong>Branding Solutions</strong>, and a curated <strong>Portfolio Network</strong>, offering both execution and visibility across industries.</p>
          </div>

          <div className="intro-grid">
            <div className="intro-card" data-aos="">
              <div className="intro-card-number">01</div>
              <h3>IT Services &amp; Digital Solutions</h3>
              <p>I deliver modern, scalable, and intelligent technology solutions tailored to business needs:</p>
              <ul className="intro-list">
                <li>Website &amp; Web App Development</li>
                <li>AI Enablement &amp; Automation (LLMs, Data Pipelines)</li>
                <li>Data Engineering &amp; Analytics (Power BI, Snowflake, SQL)</li>
                <li>Cloud &amp; Infrastructure Setup</li>
                <li>Dashboard Development &amp; Business Intelligence</li>
              </ul>
              <p className="intro-card-note">My approach focuses on performance, scalability, and real-world usability, ensuring every solution drives measurable impact.</p>
            </div>

            <div className="intro-card" data-aos="">
              <div className="intro-card-number">02</div>
              <h3>Branding &amp; Creative Services</h3>
              <p>Beyond technology, I help brands establish a strong and memorable identity:</p>
              <ul className="intro-list">
                <li>Brand Strategy &amp; Identity Design</li>
                <li>Website UI/UX &amp; Digital Experience</li>
                <li>Event &amp; Visual Branding (via R&amp;B Events expertise)</li>
                <li>Content Positioning &amp; Visual Storytelling</li>
              </ul>
              <p className="intro-card-note">The goal is simple: turn ideas into experiences that resonate and convert.</p>
            </div>

            <div className="intro-card" data-aos="">
              <div className="intro-card-number">03</div>
              <h3>Access-Driven Portfolio</h3>
              <p>A secure, access-based portfolio showcasing curated work and expertise across multiple industries.</p>
            </div>
          </div>

          {/* Why This Platform */}
          <div className="intro-why" data-aos="">
            <h3 className="intro-why-title">Why This Platform Stands Out</h3>
            <div className="intro-why-grid">
              <div className="intro-why-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <div>
                  <strong>Multi-disciplinary approach</strong>
                  <p>Tech + Branding + Talent in one place</p>
                </div>
              </div>
              <div className="intro-why-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                <div>
                  <strong>Access-controlled environment</strong>
                  <p>Professional and secure portfolio sharing</p>
                </div>
              </div>
              <div className="intro-why-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <div>
                  <strong>Real-world expertise</strong>
                  <p>Built from hands-on experience across industries</p>
                </div>
              </div>
              <div className="intro-why-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                <div>
                  <strong>Scalable vision</strong>
                  <p>Designed to grow into a global digital service ecosystem</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mission */}
          <div className="intro-mission" data-aos="">
            <h3>Mission</h3>
            <p>To bridge the gap between technology, talent, and opportunity by creating solutions that not only solve problems — but also unlock potential.</p>
          </div>
        </div>
      </section>

      {/* THREE THUMBNAILS */}
      <section className="thumbnails" id="thumbnails">
        <div className="thumbnails-grid">
          <Link to="/it-services" className="thumb-card">
            <div className="thumb-overlay"></div>
            <div className="thumb-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="8" y="8" width="48" height="36" rx="4" />
                <path d="M24 52h16M32 44v8" />
                <path d="M20 24l6 6-6 6M30 34h14" />
              </svg>
            </div>
            <div className="thumb-content">
              <span className="thumb-number">01</span>
              <h2 className="thumb-title">IT Service</h2>
              <p className="thumb-desc">AI enablement, big data engineering, website development, and scalable cloud solutions.</p>
              <span className="thumb-cta">Explore <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
            </div>
          </Link>

          <Link to="/branding" className="thumb-card">
            <div className="thumb-overlay"></div>
            <div className="thumb-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="32" cy="28" r="16" />
                <path d="M24 28l5 5 10-10" />
                <path d="M16 52h32M20 48h24" />
              </svg>
            </div>
            <div className="thumb-content">
              <span className="thumb-number">02</span>
              <h2 className="thumb-title">Branding Service</h2>
              <p className="thumb-desc">Event production, stage lighting, custom apparel, and full-scale brand experience design.</p>
              <span className="thumb-cta">Explore <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
            </div>
          </Link>

          <Link to="/portfolio" className="thumb-card">
            <div className="thumb-overlay"></div>
            <div className="thumb-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="12" y="8" width="40" height="48" rx="4" />
                <path d="M20 20h24M20 28h24M20 36h16" />
                <circle cx="44" cy="44" r="8" />
                <path d="M41 44l2 2 4-4" />
              </svg>
            </div>
            <div className="thumb-content">
              <span className="thumb-number">03</span>
              <h2 className="thumb-title">Portfolio</h2>
              <p className="thumb-desc">Resume, certifications, and project showcases across Healthcare, Finance, and Engineering.</p>
              <span className="thumb-cta">View Portfolio <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA / QUOTE FORM */}
      <section className="cta-section" id="contact">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Let's Build Something Exceptional</h2>
            <p className="cta-text">Whether you need a digital solution, branding support, or want to discuss a project — we're ready.</p>
          </div>

          {sent ? (
            <div className="quote-success" style={{ marginTop: '40px' }}>
              <div className="quote-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="64" height="64">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2>Free Quote Request Sent!</h2>
              <p>Thank you for reaching out. We'll review your request and get back to you within 24 hours.</p>
              <div className="cta-buttons" style={{ marginTop: '24px' }}>
                <button className="btn btn-primary" onClick={() => setSent(false)}>Send Another</button>
                <a href="https://calendly.com/yannicknkongolo7/30min" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Book a Consultation</a>
              </div>
            </div>
          ) : (
            <div className="quote-layout" style={{ marginTop: '40px' }}>
              <form ref={formRef} className="quote-form" onSubmit={handleQuoteSubmit}>
                <div className="quote-form-grid">
                  <div className="form-group">
                    <label htmlFor="from_name">Full Name <span className="required">*</span></label>
                    <input type="text" id="from_name" name="from_name" required placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="from_email">Email Address <span className="required">*</span></label>
                    <input type="email" id="from_email" name="from_email" required placeholder="john@example.com" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="company">Company / Organization</label>
                    <input type="text" id="company" name="company" placeholder="Acme Inc." />
                  </div>
                  <div className="form-group form-group--full">
                    <label htmlFor="service">Service Needed <span className="required">*</span></label>
                    <select id="service" name="service" required defaultValue="">
                      <option value="" disabled>Select a service</option>
                      <option value="Website Development">Website Development</option>
                      <option value="AI Enablement & Automation">AI Enablement &amp; Automation</option>
                      <option value="Big Data Engineering & Analytics">Big Data Engineering &amp; Analytics</option>
                      <option value="Cloud & Infrastructure Setup">Cloud &amp; Infrastructure Setup</option>
                      <option value="Dashboard & BI Development">Dashboard &amp; BI Development</option>
                      <option value="Brand Strategy & Identity Design">Brand Strategy &amp; Identity Design</option>
                      <option value="Event Technicians">Event Technicians</option>
                      <option value="Stage Lighting & Rental">Stage Lighting &amp; Rental</option>
                      <option value="Custom T-Shirt Printing">Custom T-Shirt Printing</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="budget">Budget Range</label>
                    <select id="budget" name="budget" defaultValue="">
                      <option value="" disabled>Select budget</option>
                      <option value="Under $1,000">Under $1,000</option>
                      <option value="$1,000 – $5,000">$1,000 – $5,000</option>
                      <option value="$5,000 – $10,000">$5,000 – $10,000</option>
                      <option value="$10,000 – $25,000">$10,000 – $25,000</option>
                      <option value="$25,000+">$25,000+</option>
                      <option value="Not sure yet">Not sure yet</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="timeline">Timeline</label>
                    <select id="timeline" name="timeline" defaultValue="">
                      <option value="" disabled>Select timeline</option>
                      <option value="ASAP">ASAP</option>
                      <option value="1 – 2 weeks">1 – 2 weeks</option>
                      <option value="1 month">1 month</option>
                      <option value="2 – 3 months">2 – 3 months</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>
                  <div className="form-group form-group--full">
                    <label htmlFor="message">Project Details <span className="required">*</span></label>
                    <textarea id="message" name="message" required rows="5" placeholder="Describe your project, goals, and any specific requirements..."></textarea>
                  </div>
                </div>

                {formError && <div className="quote-error">{formError}</div>}

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
          )}
        </div>
      </section>
    </>
  )
}
