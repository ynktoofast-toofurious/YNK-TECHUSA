import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Shared SHA-256 util ──────────────────────────────────────────────────────
async function sha256(text) {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const RESUME_MAP = [
  { hash: 'd949343d40287395916ef061561782c1a506cdaca890a92f8c12d1faa4b65def', industry: 'Healthcare', file: 'Admin/resumes/healthcare.pdf' },
  { hash: 'f9f5f3d76bbd21f24148fbf487ace9328f8a51367e014bfcf4fd06e156ba568c', industry: 'Finance',    file: 'Admin/resumes/finance.pdf' },
  { hash: '0384cec16354f94cab65c250d3d94693ec774796f9e50b2213c2663fd45240ea', industry: 'Education',  file: 'Admin/resumes/education.pdf' },
  { hash: '336fb457589f78fc54e4f24215c4133dbf85a74a30904eb774a0272bb7c6428d', industry: 'Technology', file: 'Admin/resumes/technology.pdf' },
  { hash: '23040e83f99dd6e07994719e499ed59f460562441bdb6a50ac9b5ccdf921dc30', industry: 'Government', file: 'Admin/resumes/government.pdf' },
  { hash: '78c1cb1cc907f88da58c31075e2829a32b5965583e680fe2bffeba95296e35b8', industry: 'Retail',     file: 'Admin/resumes/retail.pdf' },
]

// ─── Mini Quick-Chat Bot ──────────────────────────────────────────────────────
const QUICK_ICONS = {
  code:     <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  it:       <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  branding: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg>,
}

const QUICK_OPTIONS = [
  { id: 'code',     label: 'Request Access Code',   path: '/consultants' },
  { id: 'it',       label: 'Quote: IT Services',    path: '/it-services#quote' },
  { id: 'branding', label: 'Quote: Branding',       path: '/branding#quote' },
]

function QuickChat() {
  const navigate = useNavigate()
  const [step, setStep] = useState('idle') // idle | ready | done
  const [reply, setReply] = useState('')

  const start = () => setStep('ready')

  const pick = (opt) => {
    setReply(`Taking you to ${opt.label}…`)
    setStep('done')
    setTimeout(() => navigate(opt.path), 800)
  }

  return (
    <div className="hero-chat">
      {step === 'idle' && (
        <button className="hero-chat-start" onClick={start}>
          <span className="hero-chat-pulse" />
          <span>Ask our AI Concierge</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {step === 'ready' && (
        <div className="hero-chat-panel">
          <div className="hero-chat-bot-msg">
            <span className="hero-chat-avatar">Y</span>
            <div className="hero-chat-bubble">
              Hi! How can I help you today?
            </div>
          </div>
          <div className="hero-chat-options">
            {QUICK_OPTIONS.map((opt) => (
              <button key={opt.id} className="hero-chat-opt" onClick={() => pick(opt)}>
                <span className="hero-chat-opt-icon">{QUICK_ICONS[opt.id]}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="hero-chat-panel">
          <div className="hero-chat-bot-msg">
            <span className="hero-chat-avatar">Y</span>
            <div className="hero-chat-bubble">{reply}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Hero Panel ──────────────────────────────────────────────────────────
export default function HeroPanel() {
  const navigate = useNavigate()
  const codeRef = useRef()
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleAccess = async () => {
    const code = codeRef.current.value.trim()
    if (!code) { setError('Please enter an access code.'); return }
    setChecking(true)
    setError('')
    const hash = await sha256(code)
    const found = RESUME_MAP.find((r) => r.hash === hash)
    setChecking(false)
    if (found) {
      navigate('/consultants', { state: { autoUnlock: code } })
    } else {
      setError('Invalid code. Request access below.')
      codeRef.current.value = ''
      codeRef.current.focus()
    }
  }

  return (
    <div className="hero-panel">
      {/* Brand badge */}
      <div className="hero-panel-badge">
        <span className="section-tag" style={{ marginBottom: 0 }}>YNK-Tech USA</span>
      </div>

      {/* Headline */}
      <h1 className="hero-panel-headline">
        Technology,<br />
        <span className="text-gradient">Creativity &amp; Data</span>
      </h1>
      <p className="hero-panel-sub">IT Solutions · Branding · Consultants Portal</p>

      {/* Divider */}
      <div className="hero-panel-divider" />

      {/* Access Code */}
      <div className="hero-access">
        <p className="hero-access-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Consultants Portal Access
        </p>
        <div className="hero-access-row">
          <input
            ref={codeRef}
            type="password"
            className="hero-access-input"
            placeholder="Enter access code…"
            maxLength={30}
            autoComplete="off"
            onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
          />
          <button
            className="hero-access-btn"
            onClick={handleAccess}
            disabled={checking}
          >
            {checking ? '…' : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        {error && <p className="hero-access-error">{error}</p>}
        <button
          className="hero-access-link"
          onClick={() => navigate('/consultants')}
        >
          Request an access code →
        </button>
      </div>

      {/* Quick Chat */}
      <QuickChat />
    </div>
  )
}
