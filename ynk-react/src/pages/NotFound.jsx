import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <>
      <section className="page-hero">
        <div className="container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 className="section-title" style={{ fontSize: 'clamp(4rem, 10vw, 8rem)', marginBottom: '16px' }}>404</h1>
          <p className="section-subtitle" style={{ marginBottom: '32px' }}>Page not found</p>
          <Link to="/" className="btn btn-primary btn-lg">Back to Home</Link>
        </div>
      </section>
    </>
  )
}
