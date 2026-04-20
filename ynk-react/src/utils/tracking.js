const API_URL = import.meta.env.VITE_API_URL || ''

// localStorage keys (fallback when API not configured)
const STATS_KEY = 'ynk_site_stats'
const REQUESTS_KEY = 'ynk_access_requests'
const DYNAMIC_CODES_KEY = 'ynk_dynamic_codes'

export async function trackPageView(page) {
  if (API_URL) {
    try {
      await fetch(`${API_URL}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page }),
      })
    } catch (e) { /* silent */ }
    return
  }
  // Fallback to localStorage
  try {
    const stats = JSON.parse(localStorage.getItem(STATS_KEY) || '{}')
    if (!stats.pageViews) stats.pageViews = {}
    if (!stats.dailyViews) stats.dailyViews = {}
    const today = new Date().toISOString().slice(0, 10)
    stats.pageViews[page] = (stats.pageViews[page] || 0) + 1
    stats.totalViews = (stats.totalViews || 0) + 1
    if (!stats.dailyViews[today]) stats.dailyViews[today] = {}
    stats.dailyViews[today][page] = (stats.dailyViews[today][page] || 0) + 1
    stats.dailyViews[today]._total = (stats.dailyViews[today]._total || 0) + 1
    stats.lastVisit = new Date().toISOString()
    const days = Object.keys(stats.dailyViews).sort()
    while (days.length > 30) { delete stats.dailyViews[days.shift()] }
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (e) { /* silent */ }
}

export async function saveAccessRequest(request) {
  if (API_URL) {
    try {
      await fetch(`${API_URL}/api/access-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
    } catch (e) { /* silent */ }
    return
  }
  // Fallback to localStorage
  try {
    const requests = JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]')
    requests.push({
      ...request,
      id: 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
      status: 'pending',
      date: new Date().toISOString(),
    })
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests))
  } catch (e) { /* silent */ }
}

export async function getDynamicCodes() {
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
  let codes = []
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/data/dynamic-codes`)
      if (res.ok) codes = await res.json()
    } catch (e) { /* fall through to localStorage */ }
  }
  if (!codes.length) {
    try {
      codes = JSON.parse(localStorage.getItem(DYNAMIC_CODES_KEY) || '[]')
    } catch (e) {
      codes = []
    }
  }
  // Filter out expired codes (created > 7 days ago)
  const now = Date.now()
  return codes.filter(c => {
    if (!c.created) return true // static codes without created date
    return now - new Date(c.created).getTime() < SEVEN_DAYS
  })
}

// ── Access code usage + location tracking ──────────────────────
async function getGeoLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
    })
    if (!res.ok) return null
    const loc = await res.json()
    return {
      city:    loc.city    || '',
      region:  loc.region  || '',
      country: loc.country_name || loc.country || '',
      ip:      loc.ip      || '',
    }
  } catch (e) {
    return null
  }
}

function storeEvent(event) {
  try {
    const events = JSON.parse(localStorage.getItem('ynk_access_events') || '[]')
    events.push(event)
    if (events.length > 500) events.splice(0, events.length - 500)
    localStorage.setItem('ynk_access_events', JSON.stringify(events))
  } catch (e) { /* silent */ }
}

export async function trackAccessCodeUsage(industry, action = 'view') {
  const event = {
    type:      'access_code',
    industry:  industry || 'Unknown',
    action,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  }
  const loc = await getGeoLocation()
  if (loc) event.location = loc

  if (API_URL) {
    try {
      await fetch(`${API_URL}/api/track-event`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(event),
      })
    } catch (e) { /* silent */ }
    return
  }
  storeEvent(event)
}

export async function trackCookieConsent(choice) {
  const event = {
    type:      'cookie_consent',
    choice,    // 'all' | 'essential' | 'reject'
    timestamp: new Date().toISOString(),
  }
  const loc = await getGeoLocation()
  if (loc) event.location = loc

  if (API_URL) {
    try {
      await fetch(`${API_URL}/api/track-event`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(event),
      })
    } catch (e) { /* silent */ }
    return
  }
  storeEvent(event)
}
