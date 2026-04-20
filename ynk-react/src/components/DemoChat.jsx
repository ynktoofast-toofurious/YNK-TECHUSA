import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const SCRIPT = [
  { from: 'bot',  text: 'Hi! I\'m the YNK AI — ask me anything.', delay: 800 },
  { from: 'user', text: 'What do you actually build?',             delay: 2600 },
  { from: 'bot',  text: 'AI-powered websites, cloud infrastructure, and brand systems. Most go live in 24 hrs.', delay: 4800 },
  { from: 'user', text: 'How do I get started?',                   delay: 7200 },
  { from: 'bot',  text: 'Request your access code — we\'ll reach out within hours. 🚀', delay: 9000 },
]

const CANNED = [
  { keys: ['price', 'cost', 'how much', 'rate'],     reply: 'Pricing depends on scope. Request a quote and we\'ll send a custom estimate within 24 hours.' },
  { keys: ['website', 'site', 'web'],                reply: 'We build fast, SEO-optimised sites powered by React, Next.js, or custom stacks.' },
  { keys: ['ai', 'chatbot', 'bot', 'machine'],       reply: 'From AI chat integrations to LLM-powered tools — we ship production-ready AI features.' },
  { keys: ['brand', 'logo', 'design', 'creative'],   reply: 'Our brand team handles identity, visual systems, and campaigns that convert.' },
  { keys: ['fast', 'quick', 'time', 'long', '24'],   reply: 'Most projects launch within 24 hours of approval. Speed is our edge.' },
  { keys: ['cloud', 'aws', 'azure', 'infra'],         reply: 'We architect and deploy on AWS, Azure, or GCP — with CI/CD built in.' },
  { keys: ['consultant', 'resume', 'hire', 'talent'], reply: 'Our Consultants Portal gives clients access to vetted industry talent.' },
  { keys: ['hello', 'hi', 'hey', 'sup'],              reply: 'Hey! What can I tell you about YNK TechUSA?' },
]

function getReply(input) {
  const lower = input.toLowerCase()
  for (const { keys, reply } of CANNED) {
    if (keys.some(k => lower.includes(k))) return reply
  }
  return 'Great question! Let\'s get you a proper answer — our team can dive deep on that.'
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
  const msgsRef  = useRef()   // ref on the scrollable messages div
  const inputRef = useRef()
  const navigate = useNavigate()

  // Scroll messages container only — never the page
  const scrollToBottom = () => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
    }
  }

  useEffect(() => { scrollToBottom() }, [messages, typing])

  // Scripted playback (auto-demo)
  useEffect(() => {
    if (inputActive) return
    if (phase >= SCRIPT.length) {
      const t = setTimeout(() => { setMessages([]); setPhase(0) }, 5000)
      return () => clearTimeout(t)
    }

    const item = SCRIPT[phase]
    const showTypingAt = item.delay
    const showMsgAt    = item.delay + (item.from === 'bot' ? 900 : 500)

    const t1 = setTimeout(() => setTyping(item.from), showTypingAt)
    const t2 = setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev, { from: item.from, text: item.text, id: Date.now() }])
      setPhase(p => p + 1)
    }, showMsgAt)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [phase, inputActive])

  const sendMessage = () => {
    const val = input.trim()
    if (!val) return
    setInputActive(true)
    setInput('')
    setMessages(prev => [...prev, { from: 'user', text: val, id: Date.now() }])
    setTyping('bot')
    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev, { from: 'bot', text: getReply(val), id: Date.now() + 1 }])
      // Show quote popup shortly after bot replies
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
            placeholder="Ask me anything…"
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
            <button className="dc-quote-close" onClick={() => setShowQuote(false)} aria-label="Close">✕</button>
            <div className="dc-quote-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#29B5E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <h3 className="dc-quote-title">Let's Talk Details</h3>
            <p className="dc-quote-sub">
              Our team can give you a real answer — plus a free custom quote. Takes 2 minutes.
            </p>
            <button
              className="btn btn-primary dc-quote-btn"
              onClick={() => { setShowQuote(false); navigate('/request-quote') }}
            >
              Get a Free Quote
            </button>
            <button className="dc-quote-dismiss" onClick={() => setShowQuote(false)}>
              Keep chatting
            </button>
          </div>
        </div>
      )}
    </>
  )
}
