// Flip to true once the AWS API (Lambda + API Gateway) is back online.
export const API_ONLINE = false

// Public /exec URL of the YNK Apps Script web app (access requests + code checks).
export const INTAKE_URL = ''

export function showServiceNotice(context = 'default') {
  window.dispatchEvent(new CustomEvent('ynk:service-notice', { detail: { context } }))
}
