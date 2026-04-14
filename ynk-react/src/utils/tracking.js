const STATS_KEY = 'ynk_site_stats'
const REQUESTS_KEY = 'ynk_access_requests'
const DYNAMIC_CODES_KEY = 'ynk_dynamic_codes'

export function trackPageView(page) {
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

    // Keep only last 30 days
    const days = Object.keys(stats.dailyViews).sort()
    while (days.length > 30) {
      delete stats.dailyViews[days.shift()]
    }

    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (e) { /* silent */ }
}

export function saveAccessRequest(request) {
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

export function getDynamicCodes() {
  try {
    return JSON.parse(localStorage.getItem(DYNAMIC_CODES_KEY) || '[]')
  } catch (e) {
    return []
  }
}
