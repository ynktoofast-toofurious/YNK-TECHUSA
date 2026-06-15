import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function decodeJwtPayload(token) {
  const parts = token.split('.')
  if (parts.length < 2) return null

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')

  try {
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export default function GoogleSSOGate({ redirectTo = '/it-services/offers', onSuccess }) {
  const navigate = useNavigate()
  const buttonRef = useRef(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    const existingScript = document.getElementById('google-identity-script')
    if (existingScript) {
      if (window.google?.accounts?.id) {
        setReady(true)
      } else {
        existingScript.addEventListener('load', () => setReady(true), { once: true })
      }
      return
    }

    const script = document.createElement('script')
    script.id = 'google-identity-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => setReady(true)
    script.onerror = () => setError('Unable to load Google Sign-In right now. Please try again in a moment.')
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!ready || !clientId || !buttonRef.current || !window.google?.accounts?.id) {
      return
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        const payload = decodeJwtPayload(response?.credential || '')
        if (!payload?.email_verified) {
          setError('Google sign-in failed. Please use a verified Google account.')
          return
        }

        sessionStorage.setItem('ynk_google_user', JSON.stringify({
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        }))

        onSuccess?.()
        navigate(redirectTo, { replace: true })
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    buttonRef.current.innerHTML = ''
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 280,
    })
  }, [clientId, navigate, onSuccess, ready, redirectTo])

  return (
    <div className="ag-overlay">
      <div className="ag-card">
        <div className="ag-logo">
          <span className="text-gradient">YNK</span>
          <span className="ag-logo-dot" />
        </div>

        <h2 className="ag-title">Google Sign-In Required</h2>
        <p className="ag-sub">
          To access the Offers section, please continue with your Google account.
        </p>

        {!clientId && (
          <p className="ag-error">
            Google SSO is not configured yet. Set VITE_GOOGLE_CLIENT_ID to enable access.
          </p>
        )}

        <div
          ref={buttonRef}
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '8px',
            marginBottom: '12px',
          }}
        />

        {error && <p className="ag-error">{error}</p>}

        <button className="ag-btn-back" onClick={() => navigate('/it-services')}>
          Back to IT Services
        </button>
      </div>
    </div>
  )
}
