import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccess } from '../context/AccessContext'
import { getDynamicCodes } from '../utils/tracking'

// Same hashes as ConsultantsPortal — any valid portal code unlocks the site
const SITE_CODE_HASHES = [
  'd949343d40287395916ef061561782c1a506cdaca890a92f8c12d1faa4b65def',
  'f9f5f3d76bbd21f24148fbf487ace9328f8a51367e014bfcf4fd06e156ba568c',
  '0384cec16354f94cab65c250d3d94693ec774796f9e50b2213c2663fd45240ea',
  '336fb457589f78fc54e4f24215c4133dbf85a74a30904eb774a0272bb7c6428d',
  '23040e83f99dd6e07994719e499ed59f460562441bdb6a50ac9b5ccdf921dc30',
  '78c1cb1cc907f88da58c31075e2829a32b5965583e680fe2bffeba95296e35b8',
  'c2b47a63731365f265c92278923d928edcf08000696775cde4ba4ba2b8ccd70e', // YNK-DATAENG-2025
  'f4681ba3df0fc625a9ef41924fd878a3b23ef5229abbd65463ec67045e71d2b2', // MOISEVIEW2026
]

async function sha256(text) {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function AccessGate({ redirectTo = '/it-services' }) {
  const { unlock } = useAccess()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const inputRef = useRef()
  const navigate = useNavigate()

  const handleUnlock = async () => {
    const val = code.trim()
    if (!val) {
      setError('Please enter your access code.')
      return
    }
    setChecking(true)
    setError('')
    const hash = await sha256(val)

    let valid = SITE_CODE_HASHES.includes(hash)
    if (!valid) {
      const dynamic = await getDynamicCodes()
      valid = dynamic.some((c) => c.hash === hash)
    }

    setChecking(false)
    if (valid) {
      unlock()
      navigate(redirectTo, { replace: true })
    } else {
      setError('Invalid access code. Request access below if you need one.')
      setCode('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="ag-overlay">
      <div className="ag-card">
        {/* Logo mark */}
        <div className="ag-logo">
          <span className="text-gradient">YNK</span>
          <span className="ag-logo-dot" />
        </div>

        <h2 className="ag-title">Private Access Required</h2>
        <p className="ag-sub">
          This platform is invite-only. Enter your access code to continue,
          or request access below.
        </p>

        <div className="ag-input-wrap">
          <svg className="ag-lock-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <input
            ref={inputRef}
            className="ag-input"
            type="password"
            id="access-code"
            name="access-code"
            placeholder="Enter access code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            autoFocus
            autoComplete="off"
          />
        </div>

        {error && <p className="ag-error">{error}</p>}

        <button
          className="btn btn-primary ag-btn-unlock"
          onClick={handleUnlock}
          disabled={checking}
        >
          {checking ? (
            <span className="ag-spinner" />
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Unlock Access
            </>
          )}
        </button>

        <div className="ag-divider"><span>or</span></div>

        <button
          className="ag-btn-request"
          onClick={() => navigate('/request-quote')}
        >
          Request Access Code
        </button>

        <button className="ag-btn-back" onClick={() => navigate('/')}>
          &#8592; Back to Home
        </button>
      </div>
    </div>
  )
}
