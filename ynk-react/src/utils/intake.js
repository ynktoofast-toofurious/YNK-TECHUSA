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
