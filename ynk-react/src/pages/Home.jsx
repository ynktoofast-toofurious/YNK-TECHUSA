import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
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
            <span className="hero-line">Creativity &amp;</span>
            <span className="hero-line"><span className="text-gradient">Data</span></span>
          </h1>
          <p className="hero-subtext">IT Solutions · Branding · Consultants Portal</p>
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
            <p className="intro-lead">We provide end-to-end solutions that empower individuals and organizations to build, scale, and stand out in a fast-moving digital world.</p>
            <p className="intro-text">This platform is designed as a multi-service ecosystem—bringing together <strong>IT Services</strong>, <strong>Branding Solutions</strong>, and a secure <strong>Consultants Portal</strong>—to deliver both execution and visibility across industries.</p>
            <p className="intro-text" style={{ marginTop: '12px' }}>The mission is simple: <strong>turn ideas into scalable systems, brands into experiences, and data into decisions.</strong></p>
          </div>

          <div className="intro-grid">
            <div className="intro-card" data-aos="">
              <div className="intro-card-number">01</div>
              <h3>IT Services &amp; Digital Solutions</h3>
              <p>We deliver modern, scalable, and intelligent technology solutions tailored to real business needs:</p>
              <ul className="intro-list">
                <li>Website &amp; Web Application Development</li>
                <li>AI Enablement &amp; Automation (LLMs, Data Pipelines)</li>
                <li>Data Engineering &amp; Analytics (Power BI, Snowflake, SQL)</li>
                <li>Cloud &amp; Infrastructure Setup</li>
                <li>Dashboard Development &amp; Business Intelligence</li>
              </ul>
              <p className="intro-card-note"><strong>Vision:</strong> Enable businesses to unlock capabilities they didn't have before—whether it's automation, analytics, or scalable infrastructure.</p>
              <p className="intro-card-note"><strong>What sets this apart:</strong> Speed meets precision. For premium engagements, high-impact solutions can be designed and deployed within 24 hours, without compromising quality.</p>
              <p className="intro-card-note"><strong>Goal:</strong> Drive measurable outcomes—better decisions, faster operations, and scalable growth.</p>
            </div>

            <div className="intro-card" data-aos="">
              <div className="intro-card-number">02</div>
              <h3>Branding &amp; Creative Services</h3>
              <p>Beyond technology, we help brands build identities that are both memorable and market-ready:</p>
              <ul className="intro-list">
                <li>Brand Strategy &amp; Identity Design</li>
                <li>Website UI/UX &amp; Digital Experience</li>
                <li>Event &amp; Visual Branding (leveraging R&amp;B Events expertise)</li>
                <li>Content Positioning &amp; Visual Storytelling</li>
              </ul>
              <p className="intro-card-note"><strong>Vision:</strong> Transform ideas into experiences that resonate, differentiate, and convert.</p>
              <p className="intro-card-note"><strong>What sets this apart:</strong> Agility and creative precision. Premium requests can be executed in as little as 2 hours, enabling rapid iteration and real-time brand evolution.</p>
              <p className="intro-card-note"><strong>Goal:</strong> Create brands that not only look good—but communicate, connect, and perform.</p>
            </div>

            <div className="intro-card" data-aos="">
              <div className="intro-card-number">03</div>
              <h3>Consultants Portal</h3>
              <p>A secure, access-controlled portal designed for consultants, partners, and clients to access curated resources, insights, and expertise.</p>
              <p className="intro-card-note"><strong>Vision:</strong> Extend business capacity instantly by connecting organizations with the right expertise at the right time.</p>
              <p className="intro-card-note"><strong>What sets this apart:</strong> On-demand intelligence. Premium-level access and responses can be delivered within 1 hour, ensuring decisions are never delayed.</p>
              <p className="intro-card-note"><strong>Goal:</strong> Create a centralized ecosystem where knowledge, execution, and collaboration meet—securely and efficiently.</p>
            </div>
          </div>

          {/* Why This Platform */}
          <div className="intro-why" data-aos="">
            <h3 className="intro-why-title">Why This Platform Exists</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', textAlign: 'center' }}>Most businesses struggle with three things:</p>
            <div className="intro-why-grid">
              <div className="intro-why-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <div>
                  <strong>Execution speed</strong>
                  <p>Premium solutions delivered in hours, not weeks</p>
                </div>
              </div>
              <div className="intro-why-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div>
                  <strong>Access to expertise</strong>
                  <p>On-demand consultants and industry specialists</p>
                </div>
              </div>
              <div className="intro-why-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <div>
                  <strong>Alignment between data, technology &amp; branding</strong>
                  <p>A single, cohesive system that connects all three</p>
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '24px', textAlign: 'center' }}>We solve all three—by combining them into a single, cohesive system.</p>
          </div>

          {/* Mission */}
          <div className="intro-mission" data-aos="">
            <h3>Our Mission</h3>
            <p>Turn ideas into scalable systems, brands into experiences, and data into decisions.</p>
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
              <p className="thumb-desc">Modern, scalable technology—web apps, AI automation, data engineering, cloud infrastructure, and business intelligence.</p>
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
              <p className="thumb-desc">Brand strategy, identity design, event branding, UI/UX, and visual storytelling that resonates and converts.</p>
              <span className="thumb-cta">Explore <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
            </div>
          </Link>

          <Link to="/consultants" className="thumb-card">
            <div className="thumb-overlay"></div>
            <div className="thumb-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="22" cy="20" r="8" />
                <path d="M14 36c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                <circle cx="42" cy="20" r="8" />
                <path d="M34 36c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                <rect x="16" y="42" width="32" height="6" rx="3" />
                <path d="M28 24h8" />
              </svg>
            </div>
            <div className="thumb-content">
              <span className="thumb-number">03</span>
              <h2 className="thumb-title">Consultants Portal</h2>
              <p className="thumb-desc">Secure, access-controlled portal connecting organizations with curated resources, insights, and expertise.</p>
              <span className="thumb-cta">Enter Portal <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="contact">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Let's Build Something Exceptional</h2>
            <p className="cta-text">Whether you need a digital solution, branding support, or access to expertise—we're ready to help you build, scale, and stand out.</p>
            <div className="cta-buttons" style={{ marginTop: '32px' }}>
              <Link to="/it-services" className="btn btn-primary btn-lg">IT Services Quote</Link>
              <Link to="/branding" className="btn btn-secondary btn-lg">Branding Services Quote</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
