import { INTAKE_URL } from '../config/services'

export const intakeEnabled = Boolean(INTAKE_URL)

// text/plain keeps this a "simple" CORS request; Apps Script cannot answer preflight checks.
async function post(payload) {
  const res = await fetch(INTAKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

export function submitAccessRequest(data) {
  return post({ action: 'request', ...data })
}

export function submitTopicRequest(data) {
  return post({ action: 'topic', ...data })
}

export function submitFullAccessRequest(data) {
  return post({ action: 'fullAccess', ...data })
}

// { mode: 'ai' | 'search' | 'none', answer, sources: [{ n, title, href, kind }] }
export function askHub(q, language, history = []) {
  return post({ action: 'ask', q, language, history })
}

// { ok, html, title, trial: { token, left } | pass: { left, expires } } ; refine + html update the previous prototype.
// Errors include trial_used, trial_busy and pass_invalid | pass_expired | pass_spent.
export function generatePrototype(data) {
  return post({ action: 'prototype', ...data })
}

// { ok, valid, left, expires, reason }
export function checkBuildPass(pass) {
  return post({ action: 'pass', pass })
}

// { ok, payUrl } ; payUrl is empty when payment is arranged by email.
export function requestBuildPass(data) {
  return post({ action: 'passRequest', ...data })
}

// { ok, id } ; the ticket number is also emailed with the prototype attached.
export function submitIdeaTicket(data) {
  return post({ action: 'ticket', ...data })
}

// Resolves to { expires } for a valid personal link, false for an invalid or expired one, null if unreachable.
export async function verifyUnlock(item, token) {
  if (!intakeEnabled) return null
  try {
    const res = await post({ action: 'unlock', item, token })
    if (res && res.valid) return { expires: res.expires }
    return res && res.ok ? false : null
  } catch {
    return null
  }
}

// Resolves to { industry } for an approved, unexpired code, otherwise null.
export async function verifyAccessCode(code) {
  if (!intakeEnabled) return null
  try {
    const res = await post({ action: 'verify', code })
    return res && res.valid ? { industry: res.industry } : null
  } catch {
    return null
  }
}
