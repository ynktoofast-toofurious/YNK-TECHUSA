import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { saveAccessRequest, getDynamicCodes } from '../utils/tracking'

emailjs.init('zG_jERVPbUUfiZ6IL')

const RESUME_MAP = [
  { hash: '855ce6489207eff8d2c830bb74012fe5beece4980aa5ddffe8e4e1e55a0c3e4d', industry: 'Healthcare', file: 'Admin/resumes/healthcare.pdf', icon: '🏥' },
  { hash: 'f125a06e61497cd5ccbadd5e3c1418a270af4c42f62c7f88783a157e77981427', industry: 'Finance', file: 'Admin/resumes/finance.pdf', icon: '💰' },
  { hash: 'e57fcf9130a8154f4dddb103cdb9abb4db0aac94f81f879c209f6c530339bc34', industry: 'Education', file: 'Admin/resumes/education.pdf', icon: '🎓' },
  { hash: '71ad716e562ce56963afd1db2d3934d68205a2dde6624fada37b18cde3cd6e1b', industry: 'Technology', file: 'Admin/resumes/technology.pdf', icon: '💻' },
  { hash: '0abcfb49a64bea10e061da7ab94c7f4294f1e7e100083d40d9b2de9b313414d8', industry: 'Government', file: 'Admin/resumes/government.pdf', icon: '🏛️' },
  { hash: 'bcbc9804c46b36ee3a6f8801821a4256eca3175f0a913f12f506ecc1edc07d07', industry: 'Retail', file: 'Admin/resumes/retail.pdf', icon: '🛍️' },
]

async function sha256(text) {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function ConsultantsPortal() {
  const [unlocked, setUnlocked] = useState(false)
  const [match, setMatch] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [requestSending, setRequestSending] = useState(false)
  const [requestError, setRequestError] = useState('')
  const codeRef = useRef()
  const requestFormRef = useRef()

  const handleAccess = async () => {
    const code = codeRef.current.value.trim()
    if (!code) {
      setError('Please enter an access code.')
      return
    }
    const hash = await sha256(code)

    // Check static codes
    let found = RESUME_MAP.find((r) => r.hash === hash)

    // Check dynamic codes from localStorage (admin-approved)
    if (!found) {
      const dynamicCodes = getDynamicCodes()
      found = dynamicCodes.find((r) => r.hash === hash)
    }

    if (found) {
      setMatch(found)
      setUnlocked(true)
      setLoading(true)
      setError('')
    } else {
      setError('Invalid code. Request access below.')
      codeRef.current.value = ''
      codeRef.current.focus()
    }
  }

  const handleExit = () => {
    setUnlocked(false)
    setMatch(null)
    setLoading(false)
    if (codeRef.current) codeRef.current.value = ''
  }

  const handleDownload = () => {
    if (!match) return
    const a = document.createElement('a')
    a.href = match.file
    a.download = ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    setRequestSending(true)
    setRequestError('')

    const formData = new FormData(requestFormRef.current)
    const requestData = {
      name: formData.get('req_name'),
      email: formData.get('req_email'),
      company: formData.get('req_company') || 'N/A',
      industry: formData.get('req_industry'),
      reason: formData.get('req_reason'),
    }

    try {
      // Send notification email to admin
      await emailjs.send('service_sw3zais', 'template_8yj65yj', {
        from_name: requestData.name,
        from_email: requestData.email,
        message: `Access Code Request\n\nName: ${requestData.name}\nEmail: ${requestData.email}\nCompany: ${requestData.company}\nIndustry: ${requestData.industry}\nReason: ${requestData.reason}`,
        service: 'Consultants Portal — Access Request',
      })

      // Save to localStorage for admin portal
      saveAccessRequest(requestData)
      setRequestSent(true)
    } catch (err) {
      console.error('EmailJS error:', err)
      setRequestError(
        `Failed to send: ${err?.text || err?.message || 'Unknown error'}. Please email yannicknkongolo7@gmail.com directly.`
      )
    } finally {
      setRequestSending(false)
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">03</span>
          <h1 className="section-title">Consultants Portal</h1>
          <p className="section-subtitle">Secure access for consultants and partners</p>
        </div>
      </section>

      <section className="portfolio-section">
        <div className="container">
          {!unlocked ? (
            <>
              <div className="portfolio-gate" id="portfolioGate">
                <div className="gate-card">
                  <div className="gate-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <h3>Consultant Access</h3>
                  <p>Enter your industry-specific access code to view curated resources and documentation.</p>
                  <div className="gate-form">
                    <input
                      type="password"
                      ref={codeRef}
                      placeholder="Enter access code"
                      maxLength="30"
                      autoComplete="off"
                      onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
                    />
                    <button className="btn btn-primary" onClick={handleAccess}>
                      Access Portal
                    </button>
                  </div>
                  <div className="gate-error">{error}</div>
                  <div className="gate-divider">
                    <span>or</span>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowRequest(!showRequest)}
                  >
                    {showRequest ? 'I Have a Code' : 'Request Access Code'}
                  </button>
                </div>
              </div>

              {showRequest && !requestSent && (
                <div className="access-request-section">
                  <div className="quote-layout" style={{ marginTop: '40px' }}>
                    <form ref={requestFormRef} className="quote-form" onSubmit={handleRequestSubmit}>
                      <h3 style={{ marginBottom: '8px', color: 'var(--color-text)' }}>
                        Request Access Code
                      </h3>
                      <p
                        style={{
                          marginBottom: '24px',
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.9rem',
                        }}
                      >
                        Fill out the form below and we'll review your request. Once approved,
                        you'll receive your access code via email.
                      </p>
                      <div className="quote-form-grid">
                        <div className="form-group">
                          <label htmlFor="req_name">
                            Full Name <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            id="req_name"
                            name="req_name"
                            required
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="req_email">
                            Email Address <span className="required">*</span>
                          </label>
                          <input
                            type="email"
                            id="req_email"
                            name="req_email"
                            required
                            placeholder="john@example.com"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="req_company">Company / Organization</label>
                          <input
                            type="text"
                            id="req_company"
                            name="req_company"
                            placeholder="Acme Inc."
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="req_industry">
                            Industry <span className="required">*</span>
                          </label>
                          <select id="req_industry" name="req_industry" required defaultValue="">
                            <option value="" disabled>
                              Select industry
                            </option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Finance">Finance</option>
                            <option value="Education">Education</option>
                            <option value="Technology">Technology</option>
                            <option value="Government">Government</option>
                            <option value="Retail">Retail</option>
                          </select>
                        </div>
                        <div className="form-group form-group--full">
                          <label htmlFor="req_reason">
                            Reason for Access <span className="required">*</span>
                          </label>
                          <textarea
                            id="req_reason"
                            name="req_reason"
                            required
                            rows="4"
                            placeholder="Briefly describe why you need access to the consultants portal..."
                          ></textarea>
                        </div>
                      </div>

                      {requestError && <div className="quote-error">{requestError}</div>}

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={requestSending}
                        style={{ width: '100%', marginTop: '8px' }}
                      >
                        {requestSending ? (
                          <>
                            <span className="btn-spinner"></span> Sending...
                          </>
                        ) : (
                          'Submit Access Request'
                        )}
                      </button>
                    </form>

                    <div className="quote-sidebar">
                      <div className="quote-info-card">
                        <h3>How It Works</h3>
                        <div className="quote-steps">
                          <div className="quote-step">
                            <div className="quote-step-num">1</div>
                            <div>
                              <strong>Submit Request</strong>
                              <p>Fill out the form with your details and industry.</p>
                            </div>
                          </div>
                          <div className="quote-step">
                            <div className="quote-step-num">2</div>
                            <div>
                              <strong>Admin Review</strong>
                              <p>Our team reviews your request within 24 hours.</p>
                            </div>
                          </div>
                          <div className="quote-step">
                            <div className="quote-step-num">3</div>
                            <div>
                              <strong>Receive Code</strong>
                              <p>
                                Once approved, you'll receive your access code via email.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="quote-info-card">
                        <h3>Direct Contact</h3>
                        <p className="quote-contact-email">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            width="18"
                            height="18"
                          >
                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <a href="mailto:yannicknkongolo7@gmail.com">
                            yannicknkongolo7@gmail.com
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {requestSent && (
                <div className="quote-success" style={{ marginTop: '40px' }}>
                  <div className="quote-success-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="64"
                      height="64"
                    >
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h2>Access Request Submitted!</h2>
                  <p>
                    We've received your request and will review it within 24 hours. You'll
                    receive your access code via email once approved.
                  </p>
                  <div className="cta-buttons" style={{ marginTop: '24px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setRequestSent(false)
                        setShowRequest(false)
                      }}
                    >
                      Back to Portal
                    </button>
                  </div>
                </div>
              )}

              {!showRequest && !requestSent && (
                <div className="detail-action">
                  <Link to="/" className="btn btn-secondary">
                    &larr; Back to Home
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="portfolio-content">
              <div className="resume-viewer-bar">
                <span className="industry-badge-inline">
                  {match.icon} {match.industry} Resume
                </span>
                <div className="resume-viewer-actions">
                  <button className="btn btn-primary btn-sm" onClick={handleDownload}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PDF
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleExit}>
                    Exit
                  </button>
                </div>
              </div>
              <div className="resume-pdf-wrapper">
                {loading && (
                  <div className="pdf-loading-indicator">
                    <div className="pdf-spinner"></div>
                    <p>Loading document...</p>
                  </div>
                )}
                <iframe
                  src={match.file}
                  className="resume-pdf-frame"
                  title="Consultant Document"
                  onLoad={() => setLoading(false)}
                  style={{ opacity: loading ? 0 : 1 }}
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
