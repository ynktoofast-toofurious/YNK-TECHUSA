const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
}

export function ArrowLeft({ size = 14, className = 'icon-inline' }) {
  return (
    <svg {...base} className={className} width={size} height={size} viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

export function ArrowRight({ size = 14, className = 'icon-inline' }) {
  return (
    <svg {...base} className={className} width={size} height={size} viewBox="0 0 24 24">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export function CloseIcon({ size = 14, className = 'icon-inline' }) {
  return (
    <svg {...base} className={className} width={size} height={size} viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function ArrowUp({ size = 14, className = 'icon-inline' }) {
  return (
    <svg {...base} className={className} width={size} height={size} viewBox="0 0 24 24">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

export function ChevronDown({ size = 12, className = 'icon-inline' }) {
  return (
    <svg {...base} className={className} width={size} height={size} viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function Globe({ size = 16, className = 'icon-inline' }) {
  return (
    <svg {...base} strokeWidth={1.5} className={className} width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  )
}

const FLAG_PROPS = { width: 28, height: 20, viewBox: '0 0 30 20', 'aria-hidden': true, focusable: 'false', className: 'lang-flag-svg' }

export function FlagUS() {
  return (
    <svg {...FLAG_PROPS}>
      <rect width="30" height="20" rx="3" fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={(20 / 13) * i} width="30" height={20 / 13} fill="#fff" />
      ))}
      <rect width="13" height={(20 / 13) * 7} fill="#3C3B6E" />
    </svg>
  )
}

export function FlagFR() {
  return (
    <svg {...FLAG_PROPS}>
      <rect width="30" height="20" rx="3" fill="#fff" />
      <path d="M3 0h7v20H3a3 3 0 01-3-3V3a3 3 0 013-3z" fill="#0055A4" />
      <path d="M20 0h7a3 3 0 013 3v14a3 3 0 01-3 3h-7z" fill="#EF4135" />
    </svg>
  )
}

export function FlagES() {
  return (
    <svg {...FLAG_PROPS}>
      <rect width="30" height="20" rx="3" fill="#AA151B" />
      <rect y="5" width="30" height="10" fill="#F1BF00" />
    </svg>
  )
}
