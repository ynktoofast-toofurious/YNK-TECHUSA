const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => MAP[c])
}

export function escapeAll(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, escapeHtml(v)]))
}
