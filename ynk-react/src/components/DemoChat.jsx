import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

// Static metadata: who speaks and when. Text comes from translations.
const SCRIPT_META = [
  { from: 'bot',  delay: 800 },
  { from: 'user', delay: 2600 },
  { from: 'bot',  delay: 4800 },
  { from: 'user', delay: 7200 },
  { from: 'bot',  delay: 9000 },
]

function getReply(input, canned, fallback) {
  const lower = input.toLowerCase()
  for (const { keys, reply } of canned) {
    if (keys.some(k => lower.includes(k))) return reply
  }
  return fallback
}

function TypingDots() {
  return (
    <span className="dc-typing-dots" aria-label="typing">
      <span /><span /><span />
    </span>
  )
}

export default function DemoChat() {
  const [messages, setMessages]       = useState([])
  const [phase, setPhase]             = useState(0)
  const [typing, setTyping]           = useState(false)
  const [input, setInput]             = useState('')
  const [inputActive, setInputActive] = useState(false)
  const [showQuote, setShowQuote]     = useState(false)
  const msgsRef  = useRef()
  const inputRef = useRef()
  const navigate = useNavigate()
  const { t, language } = useLanguage()

  // Build SCRIPT and CANNED from translations whenever language changes
  const SCRIPT = useMemo(() => {
    const texts = t('demoChat.script')
    return SCRIPT_META.map((m, i) => ({ ...m, text: Array.isArray(texts) ? (texts[i] || '') : '' }))
  }, [t])

  const CANNED = useMemo(() => {
    const c = t('demoChat.canned')
    return Array.isArray(c) ? c : []
  }, [t])

  // Scroll messages container only — never the page
  const scrollToBottom = () => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
    }
  }

  useEffect(() => { scrollToBottom() }, [messages, typing])

  // Reset demo when language changes (unless user already typed)
  useEffect(() => {
    if (!inputActive) {
      setMessages([])
      setPhase(0)
      setTyping(false)
    }
  }, [language]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scripted playback (auto-demo)
  useEffect(() => {
    if (inputActive) return
    if (phase >= SCRIPT.length) {
      const t = setTimeout(() => { setMessages([]); setPhase(0) }, 5000)
      return () => clearTimeout(t)
    }

    const item = SCRIPT[phase]
    if (!item) return
    const showTypingAt = item.delay
    const showMsgAt    = item.delay + (item.from === 'bot' ? 900 : 500)

    const t1 = setTimeout(() => setTyping(item.from), showTypingAt)
    const t2 = setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev, { from: item.from, text: item.text, id: Date.now() }])
      setPhase(p => p + 1)
    }, showMsgAt)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [phase, inputActive, SCRIPT])

  const sendMessage = () => {
    const val = input.trim()
    if (!val) return
    setInputActive(true)
    setInput('')
    setMessages(prev => [...prev, { from: 'user', text: val, id: Date.now() }])
    setTyping('bot')
    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev, {
        from: 'bot',
        text: getReply(val, CANNED, t('demoChat.fallback')),
        id: Date.now() + 1,
      }])
      setTimeout(() => setShowQuote(true), 600)
    }, 1100)
  }

  return (
    <>
      <div className="dc-wrap">
        {/* header */}
        <div className="dc-header">
          <span className="dc-avatar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#29B5E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </span>
          <span className="dc-header-name">YNK AI</span>
          <span className="dc-online-dot" />
        </div>

        {/* messages */}
        <div className="dc-messages" ref={msgsRef}>
          {messages.map(m => (
            <div key={m.id} className={`dc-msg dc-msg--${m.from}`}>
              <span className="dc-bubble">{m.text}</span>
            </div>
          ))}
          {typing && (
            <div className={`dc-msg dc-msg--${typing}`}>
              <span className="dc-bubble dc-bubble--typing"><TypingDots /></span>
            </div>
          )}
        </div>

        {/* input */}
        <div className="dc-input-row">
          <input
            ref={inputRef}
            className="dc-input"
            type="text"
            id="demo-chat-input"
            name="demo-chat-message"
            placeholder={t('demoChat.placeholder')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            onFocus={() => setInputActive(true)}
          />
          <button className="dc-send" onClick={sendMessage} aria-label="Send">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>

      {/* Quote popup */}
      {showQuote && (
        <div className="dc-quote-overlay" onClick={() => setShowQuote(false)}>
          <div className="dc-quote-card" onClick={e => e.stopPropagation()}>
            <button className="dc-quote-close" onClick={() => setShowQuote(false)} aria-label="Close">&#x2715;</button>
            <div className="dc-quote-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#29B5E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <h3 className="dc-quote-title">{t('demoChat.quoteTitle')}</h3>
            <p className="dc-quote-sub">{t('demoChat.quoteSub')}</p>
            <button
              className="btn btn-primary dc-quote-btn"
              onClick={() => { setShowQuote(false); navigate('/request-quote') }}
            >
              {t('demoChat.quoteBtn')}
            </button>
            <button className="dc-quote-dismiss" onClick={() => setShowQuote(false)}>
              {t('demoChat.quoteDismiss')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

