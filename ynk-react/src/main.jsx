import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import App from './App.jsx'
import './styles/global.css'

// Clickjacking guard: X-Frame-Options can't be set on GitHub Pages, so refuse to render inside a foreign frame.
function isForeignFramed() {
  if (window.top === window.self) return false
  try {
    return window.top.location.origin !== window.location.origin
  } catch {
    return true
  }
}

if (isForeignFramed()) {
  try { window.top.location.href = window.location.href } catch { /* blocked by browser */ }
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </StrictMode>
  )
}
