import { useEffect, useState } from 'react'
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom'
import { trackPageView } from './utils/tracking'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import LanguagePopup from './components/LanguagePopup'
import AccessGate from './components/AccessGate'
import GoogleSSOGate from './components/GoogleSSOGate'
import CookieConsent from './components/CookieConsent'
import { AccessProvider, useAccess } from './context/AccessContext'
import Home from './pages/Home'
import ITServices from './pages/ITServices'
import ServiceOffers from './pages/ServiceOffers'
import Branding from './pages/Branding'
import ConsultantsPortal from './pages/ConsultantsPortal'
import RequestQuote from './pages/RequestQuote'
import NotFound from './pages/NotFound'

const PAGE_MAP = {
  '/': 'home',
  '/it-services': 'it-services',
  '/it-services/offers': 'it-services-offers',
  '/it-services/offres': 'it-services-offers-legacy',
  '/branding': 'branding',
  '/consultants': 'consultants',
  '/request-quote': 'request-quote',
}

function ProtectedRoute({ children }) {
  const { isUnlocked } = useAccess()
  const location = useLocation()
  if (!isUnlocked) {
    return <AccessGate redirectTo={location.pathname} />
  }
  return children
}

function OffersGoogleRoute({ children }) {
  const { isUnlocked } = useAccess()
  const [hasGoogleSSO, setHasGoogleSSO] = useState(
    () => sessionStorage.getItem('ynk_google_sso') === '1'
  )
  const location = useLocation()
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  if (!googleClientId) {
    if (!isUnlocked) {
      return <AccessGate redirectTo={location.pathname} />
    }
    return children
  }

  if (!hasGoogleSSO) {
    return (
      <GoogleSSOGate
        redirectTo={location.pathname}
        onSuccess={() => {
          sessionStorage.setItem('ynk_google_sso', '1')
          setHasGoogleSSO(true)
        }}
      />
    )
  }

  return children
}

function LegacyOfferDetailRedirect() {
  const { offerId } = useParams()
  return <Navigate to={`/it-services/offers/${offerId}`} replace />
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
        <Route path="/request-quote" element={<RequestQuote />} />
        <Route path="/it-services" element={<ProtectedRoute><ITServices /></ProtectedRoute>} />
        <Route path="/it-services/offers" element={<OffersGoogleRoute><ServiceOffers /></OffersGoogleRoute>} />
        <Route path="/it-services/offers/:offerId" element={<OffersGoogleRoute><ServiceOffers /></OffersGoogleRoute>} />
        <Route path="/it-services/offres" element={<Navigate to="/it-services/offers" replace />} />
        <Route path="/it-services/offres/:offerId" element={<LegacyOfferDetailRedirect />} />
        <Route path="/branding" element={<ProtectedRoute><Branding /></ProtectedRoute>} />
        <Route path="/consultants" element={<ProtectedRoute><ConsultantsPortal /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </AccessProvider>
  )
}

export default App
