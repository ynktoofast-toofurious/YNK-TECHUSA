import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'

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
  const codeRef = useRef()

  const handleAccess = async () => {
    const code = codeRef.current.value.trim()
    if (!code) {
      setError('Please enter an access code.')
      return
    }
    const hash = await sha256(code)
    const found = RESUME_MAP.find((r) => r.hash === hash)
    if (found) {
      setMatch(found)
      setUnlocked(true)
      setLoading(true)
      setError('')
    } else {
      setError('Invalid code. Request one via the link below.')
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
            <div className="portfolio-gate" id="portfolioGate">
              <div className="gate-card">
                <div className="gate-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
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
                  <button className="btn btn-primary" onClick={handleAccess}>Access Portal</button>
                </div>
                <div className="gate-error">{error}</div>
                <div className="gate-divider"><span>or</span></div>
                <a href="https://calendly.com/yannicknkongolo7/30min" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Book a Consultation</a>
              </div>
            </div>
          ) : (
            <div className="portfolio-content">
              <div className="resume-viewer-bar">
                <span className="industry-badge-inline">{match.icon} {match.industry} Resume</span>
                <div className="resume-viewer-actions">
                  <button className="btn btn-primary btn-sm" onClick={handleDownload}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Download PDF
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleExit}>Exit</button>
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

          {!unlocked && (
            <div className="detail-action">
              <Link to="/" className="btn btn-secondary">&larr; Back to Home</Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
