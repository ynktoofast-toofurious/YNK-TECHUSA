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

      {/* CTA */}
      <section className="cta-section" id="contact">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Let's Build Something Exceptional</h2>
            <p className="cta-text">Whether you need a digital solution, branding support, or want to discuss a project — we're ready.</p>
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
