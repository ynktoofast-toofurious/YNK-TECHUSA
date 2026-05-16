import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
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
import RequestQuote from './pages/RequestQuote'
import YBPrinting from './pages/YBPrinting'
import NotFound from './pages/NotFound'

const PAGE_MAP = {
  '/': 'home',
  '/it-services': 'it-services',
  '/branding': 'branding',
  '/consultants': 'consultants',
  '/request-quote': 'request-quote',
  '/yb-Printing': 'yb-printing',
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
  const isYBPrintingPage = location.pathname === '/yb-Printing'

  useEffect(() => {
    const page = PAGE_MAP[location.pathname] || 'other'
    trackPageView(page)
  }, [location.pathname])

  return (
    <AccessProvider>
      {!isYBPrintingPage && <LanguagePopup />}
      <ScrollToTop />
      {!isYBPrintingPage && <CookieConsent />}
      {!isYBPrintingPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/request-quote" element={<RequestQuote />} />
        <Route path="/it-services" element={<ProtectedRoute><ITServices /></ProtectedRoute>} />
        <Route path="/branding" element={<ProtectedRoute><Branding /></ProtectedRoute>} />
        <Route path="/consultants" element={<ProtectedRoute><ConsultantsPortal /></ProtectedRoute>} />
        <Route path="/yb-Printing" element={<YBPrinting />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isYBPrintingPage && <Footer />}
    </AccessProvider>
  )
}

export default App
