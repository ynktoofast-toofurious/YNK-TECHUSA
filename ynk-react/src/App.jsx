import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import ITServices from './pages/ITServices'
import Branding from './pages/Branding'
import Portfolio from './pages/Portfolio'
import RequestQuote from './pages/RequestQuote'
import NotFound from './pages/NotFound'

function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/it-services" element={<ITServices />} />
        <Route path="/branding" element={<Branding />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/request-quote" element={<RequestQuote />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App
