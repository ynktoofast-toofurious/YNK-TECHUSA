// Flip to true once the AWS API (Lambda + API Gateway) is back online.
export const API_ONLINE = false

export function showServiceNotice(context = 'default') {
  window.dispatchEvent(new CustomEvent('ynk:service-notice', { detail: { context } }))
}
