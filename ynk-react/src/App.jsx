import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { trackPageView } from './utils/tracking'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import LanguagePopup from './components/LanguagePopup'
import AccessGate from './components/AccessGate'
import CookieConsent from './components/CookieConsent'
import { AccessProvider, useAccess } from './context/AccessContext'
import Home from './pages/Home'
import ITServices from './pages/ITServices'
import Branding from './pages/Branding'
import ConsultantsPortal from './pages/ConsultantsPortal'
import StartProject from './pages/StartProject'
import Latest from './pages/Latest'
import NotFound from './pages/NotFound'

const PAGE_MAP = {
  '/': 'home',
  '/it-services': 'it-services',
  '/branding': 'branding',
  '/consultants': 'consultants',
  '/start-project': 'start-project',
  '/latest': 'latest',
}

function LegacyQuoteRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/start-project${search}`} replace />
}

function ProtectedRoute({ children }) {
  const { isUnlocked } = useAccess()
  const location = useLocation()
  if (!isUnlocked) {
    return <AccessGate redirectTo={location.pathname} />
  }
  return children
}

function App() {
  const location = useLocation()

  useEffect(() => {
    const page = PAGE_MAP[location.pathname] || 'other'
    trackPageView(page)
  }, [location.pathname])

  return (
    <AccessProvider>
      <LanguagePopup />
      <ScrollToTop />
      <CookieConsent />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/start-project" element={<StartProject />} />
        <Route path="/latest" element={<Latest />} />
        <Route path="/request-quote" element={<LegacyQuoteRedirect />} />
        <Route path="/it-services" element={<ProtectedRoute><ITServices /></ProtectedRoute>} />
        <Route path="/branding" element={<ProtectedRoute><Branding /></ProtectedRoute>} />
        <Route path="/consultants" element={<ProtectedRoute><ConsultantsPortal /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </AccessProvider>
  )
}

export default App
