import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { verifyUnlock } from './intake'

const STORE_KEY = 'ynk-full-access'

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}
  } catch {
    return {}
  }
}

export function hasFullAccess(itemId) {
  const entry = readStore()[itemId]
  return Boolean(entry && entry.expires > Date.now())
}

function grant(itemId, expires) {
  try {
    const all = readStore()
    all[itemId] = { expires }
    localStorage.setItem(STORE_KEY, JSON.stringify(all))
  } catch { /* storage unavailable */ }
}

// A personal link (?access=...) is checked once with the server, then remembered on this device until it expires.
export function useFullAccess(itemId) {
  const location = useLocation()
  const navigate = useNavigate()
  const token = new URLSearchParams(location.search).get('access')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!token) return
    let active = true
    verifyUnlock(itemId, token).then((res) => {
      if (res) grant(itemId, res.expires)
      if (!active) return
      setResult({ itemId, valid: res })
      const params = new URLSearchParams(location.search)
      params.delete('access')
      const search = params.toString()
      navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash }, { replace: true })
    })
    return () => { active = false }
  }, [itemId, token, location.pathname, location.search, location.hash, navigate])

  const checked = result && result.itemId === itemId
  return {
    unlocked: hasFullAccess(itemId),
    checking: Boolean(token) && !checked,
    invalid: Boolean(checked && result.valid === false),
  }
}
