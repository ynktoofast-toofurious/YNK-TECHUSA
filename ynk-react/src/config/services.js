// Flip to true once the AWS API (Lambda + API Gateway) is back online.
export const API_ONLINE = false

// Public /exec URL of the YNK Apps Script web app (access requests + code checks).
export const INTAKE_URL = 'https://script.google.com/macros/s/AKfycby0N2pE9CuP45h_yXgRbFBV7jQU0EKYjKptdiA5M2CL39laLRTtd7L89jtDBwtJaNxHkQ/exec'

export function showServiceNotice(context = 'default') {
  window.dispatchEvent(new CustomEvent('ynk:service-notice', { detail: { context } }))
}
