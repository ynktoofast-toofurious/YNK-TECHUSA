import { INTAKE_URL } from '../config/services'

export const intakeEnabled = Boolean(INTAKE_URL)

// Capacity limits, pauses and outages all surface as one soft "short break" notice, never a hard error.
const BUSY_CODES = ['busy', 'paused', 'rate_limited', 'server_error']

export function isBusy(errOrCode) {
  return BUSY_CODES.includes(typeof errOrCode === 'string' ? errOrCode : errOrCode?.message)
}

function signalBusy(action) {
  window.dispatchEvent(new CustomEvent('ynk:busy', { detail: { action } }))
}

// text/plain keeps this a "simple" CORS request; Apps Script cannot answer preflight checks.
async function post(payload) {
  let res
  try {
    res = await fetch(INTAKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    })
  } catch {
    if (payload.action !== 'prototypeStatus') signalBusy(payload.action)
    throw new Error('busy')
  }
  if (!res.ok) {
    signalBusy(payload.action)
    throw new Error('busy')
  }
  const data = await res.json()
  if (data && data.ok === false && isBusy(data.error)) signalBusy(payload.action)
  return data
}

let statusCache = null

// { paused: { ask, studio, forms } }, fetched once every few minutes; unknown means nothing is paused.
export async function serviceStatus() {
  if (!intakeEnabled) return { paused: {} }
  if (statusCache && Date.now() - statusCache.at < 120000) return statusCache.value
  try {
    const value = await post({ action: 'status' })
    statusCache = { at: Date.now(), value: { paused: value.paused || {} } }
    return statusCache.value
  } catch {
    return { paused: {} }
  }
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
// Long designs come back as { ok, pending, job }: poll prototypeStatus(job) until it returns the html.
// Errors include trial_used, trial_busy, blocked and pass_invalid | pass_expired | pass_spent.
export function generatePrototype(data) {
  return post({ action: 'prototype', ...data })
}

export function prototypeStatus(job) {
  return post({ action: 'prototypeStatus', job })
}

// { ok, ref } ; the server emails the team and the visitor.
export function submitBrief(data) {
  return post({ action: 'brief', ...data })
}

export function submitQuote(data) {
  return post({ action: 'quote', ...data })
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
