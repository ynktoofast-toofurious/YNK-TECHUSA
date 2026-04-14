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
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/data/dynamic-codes`)
      if (res.ok) return await res.json()
    } catch (e) { /* fall through to localStorage */ }
  }
  try {
    return JSON.parse(localStorage.getItem(DYNAMIC_CODES_KEY) || '[]')
  } catch (e) {
    return []
  }
}
