import { useState, useRef } from 'react'
import emailjs from '@emailjs/browser'
import { useLanguage } from '../i18n/LanguageContext'

emailjs.init('zG_jERVPbUUfiZ6IL')

export default function QuoteForm({ serviceOptions }) {
  const formRef = useRef()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')
  const { t } = useLanguage()

  const handleQuoteSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setFormError('')
    try {
      await emailjs.sendForm(
        'service_sw3zais',
        'template_8yj65yj',
        formRef.current
      )
      setSent(true)
    } catch (err) {
      console.error('EmailJS error:', err)
      setFormError(`Failed to send: ${err?.text || err?.message || 'Unknown error'}. Please email us directly at yannicknkongolo7@gmail.com`)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="quote-success" style={{ marginTop: '40px' }}>
        <div className="quote-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="64" height="64">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2>{t('quoteForm.successTitle')}</h2>
        <p>{t('quoteForm.successText')}</p>
        <div className="cta-buttons" style={{ marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={() => setSent(false)}>{t('quoteForm.sendAnother')}</button>
          <a href="https://calendly.com/yannicknkongolo7/30min" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">{t('quoteForm.bookConsult')}</a>
        </div>
      </div>
    )
  }

  return (
    <div className="quote-layout" style={{ marginTop: '40px' }}>
      <form ref={formRef} className="quote-form" onSubmit={handleQuoteSubmit}>
        <div className="quote-form-grid">
          <div className="form-group">
            <label htmlFor="from_name">{t('quoteForm.fullName')} <span className="required">*</span></label>
            <input type="text" id="from_name" name="from_name" required placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label htmlFor="from_email">{t('quoteForm.emailAddr')} <span className="required">*</span></label>
            <input type="email" id="from_email" name="from_email" required placeholder="john@example.com" />
          </div>
          <div className="form-group">
            <label htmlFor="phone">{t('quoteForm.phone')}</label>
            <input type="tel" id="phone" name="phone" placeholder="+1 (555) 000-0000" />
          </div>
          <div className="form-group">
            <label htmlFor="company">{t('quoteForm.company')}</label>
            <input type="text" id="company" name="company" placeholder="Acme Inc." />
          </div>
          <div className="form-group form-group--full">
            <label htmlFor="service">{t('quoteForm.serviceNeeded')} <span className="required">*</span></label>
            <select id="service" name="service" required defaultValue="">
              <option value="" disabled>{t('quoteForm.selectService')}</option>
              {serviceOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              <option value="Other">{t('quoteForm.other')}</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="budget">{t('quoteForm.budget')}</label>
            <select id="budget" name="budget" defaultValue="">
              <option value="" disabled>{t('quoteForm.selectBudget')}</option>
              {(t('budgetOptions') || []).map((b, i) => (
                <option key={i} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="timeline">{t('quoteForm.timeline')}</label>
            <select id="timeline" name="timeline" defaultValue="">
              <option value="" disabled>{t('quoteForm.selectTimeline')}</option>
              {(t('timelineOptions') || []).map((tl, i) => (
                <option key={i} value={tl}>{tl}</option>
              ))}
            </select>
          </div>
          <div className="form-group form-group--full">
            <label htmlFor="message">{t('quoteForm.projectDetails')} <span className="required">*</span></label>
            <textarea id="message" name="message" required rows="5" placeholder={t('quoteForm.projectPlaceholder')}></textarea>
          </div>
        </div>

        {formError && <div className="quote-error">{formError}</div>}

        <button type="submit" className="btn btn-primary btn-lg" disabled={sending} style={{ width: '100%', marginTop: '8px' }}>
          {sending ? (
            <>
              <span className="btn-spinner"></span>
              {t('quoteForm.sending')}
            </>
          ) : (
            t('quoteForm.submitBtn')
          )}
        </button>
      </form>

      <div className="quote-sidebar">
        <div className="quote-info-card">
          <h3>{t('quoteForm.whatNext')}</h3>
          <div className="quote-steps">
            <div className="quote-step">
              <div className="quote-step-num">1</div>
              <div>
                <strong>{t('quoteForm.step1Title')}</strong>
                <p>{t('quoteForm.step1Desc')}</p>
              </div>
            </div>
            <div className="quote-step">
              <div className="quote-step-num">2</div>
              <div>
                <strong>{t('quoteForm.step2Title')}</strong>
                <p>{t('quoteForm.step2Desc')}</p>
              </div>
            </div>
            <div className="quote-step">
              <div className="quote-step-num">3</div>
              <div>
                <strong>{t('quoteForm.step3Title')}</strong>
                <p>{t('quoteForm.step3Desc')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="quote-info-card">
          <h3>Prefer to Talk?</h3>
          <p>Book a free 30-minute consultation call to discuss your project directly.</p>
          <a href="https://calendly.com/yannicknkongolo7/30min" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: '100%', marginTop: '16px' }}>
            Book a Consultation
          </a>
        </div>

        <div className="quote-info-card">
          <h3>Direct Contact</h3>
          <p className="quote-contact-email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <a href="mailto:yannicknkongolo7@gmail.com">yannicknkongolo7@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
