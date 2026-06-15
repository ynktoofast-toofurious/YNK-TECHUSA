import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ACCESS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const OFFERS_ACCESS_KEY = 'ynk_offers_access_until'

export default function OffersAccessGate({ redirectTo = '/it-services/offers', onSuccess }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const expectedCode = import.meta.env.VITE_OFFERS_ACCESS_CODE || 'YNK-OFFERS-7DAY'

  const handleUnlock = () => {
    const value = code.trim()
    if (!value) {
      setError('Please enter the Offers access code.')
      return
    }

    setChecking(true)
    setError('')

    if (value === expectedCode) {
      const expiresAt = Date.now() + ACCESS_WINDOW_MS
      sessionStorage.setItem(OFFERS_ACCESS_KEY, String(expiresAt))
      setChecking(false)
      onSuccess?.()
      navigate(redirectTo, { replace: true })
      return
    }

    setChecking(false)
    setError('Invalid code. Please check the Offers access code and try again.')
    setCode('')
    inputRef.current?.focus()
  }

  return (
    <div className="ag-overlay">
      <div className="ag-card">
        <div className="ag-logo">
          <span className="text-gradient">YNK</span>
          <span className="ag-logo-dot" />
        </div>

        <h2 className="ag-title">Offers Access Required</h2>
        <p className="ag-sub">
          Enter the Offers code to continue. Access will expire in 7 days.
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
            id="offers-access-code"
            name="offers-access-code"
            placeholder="Enter Offers access code"
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
              Unlock Offers
            </>
          )}
        </button>

        <button className="ag-btn-back" onClick={() => navigate('/it-services')}>
          &#8592; Back to IT Services
        </button>
      </div>
    </div>
  )
}
