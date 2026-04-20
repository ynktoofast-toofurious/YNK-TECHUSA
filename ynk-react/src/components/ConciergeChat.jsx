import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const NAV_OPTIONS = [
  { label: '⚡ IT Services & Digital Solutions', path: '/it-services', desc: 'Web, AI, Cloud & Data' },
  { label: '🎨 Branding & Creative Services', path: '/branding', desc: 'Design, Events & Identity' },
  { label: '🔐 Consultants Portal', path: '/consultants', desc: 'Secure access & resources' },
  { label: '💬 Request a Free Quote', path: '/request-quote', desc: 'Get started today' },
]

const GREETING = "Hi! I'm YNK's AI Concierge. How can I help you today?"
const FOLLOW_UP = 'Choose a section below or ask me anything:'

function useTypingEffect(text, speed = 28) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  return { displayed, done }
}

function BotMessage({ text, onDone }) {
  const { displayed, done } = useTypingEffect(text)
  useEffect(() => {
    if (done && onDone) onDone()
  }, [done, onDone])
  return (
    <div className="cc-msg cc-msg--bot">
      <span className="cc-avatar">Y</span>
      <div className="cc-bubble">
        {displayed}
        {!done && <span className="cc-cursor">|</span>}
      </div>
    </div>
  )
}

function UserMessage({ text }) {
  return (
    <div className="cc-msg cc-msg--user">
      <div className="cc-bubble cc-bubble--user">{text}</div>
    </div>
  )
}

export default function ConciergeChat() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [showNav, setShowNav] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [phase, setPhase] = useState('greeting') // greeting | followup | ready
  const bottomRef = useRef(null)

  // Initialize chat when opened
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ type: 'bot', text: GREETING, id: 0 }])
      setPhase('greeting')
      setShowNav(false)
    }
  }, [open, messages.length])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showNav])

  const handleGreetingDone = () => {
    if (phase === 'greeting') {
      setTimeout(() => {
        setMessages(prev => [...prev, { type: 'bot', text: FOLLOW_UP, id: Date.now() }])
        setPhase('followup')
      }, 300)
    }
  }

  const handleFollowUpDone = () => {
    setShowNav(true)
    setPhase('ready')
  }

  const handleNavClick = (option) => {
    const userMsg = { type: 'user', text: option.label.replace(/^[\S]+\s/, ''), id: Date.now() }
    const botMsg = { type: 'bot', text: `Great! Taking you to ${option.label.replace(/^[\S]+\s/, '')}...`, id: Date.now() + 1 }
    setMessages(prev => [...prev, userMsg, botMsg])
    setShowNav(false)
    setTimeout(() => navigate(option.path), 900)
  }

  const handleInputSubmit = (e) => {
    e.preventDefault()
    const q = inputVal.trim()
    if (!q) return
    setInputVal('')

    // Simple keyword matching
    const lower = q.toLowerCase()
    let match = null
    if (/it|tech|web|ai|cloud|data|software|automat/.test(lower)) match = NAV_OPTIONS[0]
    else if (/brand|design|logo|event|print|creative/.test(lower)) match = NAV_OPTIONS[1]
    else if (/consult|portal|access|resour/.test(lower)) match = NAV_OPTIONS[2]
    else if (/quote|price|cost|hire|start|help/.test(lower)) match = NAV_OPTIONS[3]

    const userMsg = { type: 'user', text: q, id: Date.now() }
    if (match) {
      const botReply = { type: 'bot', text: `Sure! It sounds like you're interested in our ${match.label.replace(/^[\S]+\s/, '')}. Taking you there now!`, id: Date.now() + 1 }
      setMessages(prev => [...prev, userMsg, botReply])
      setShowNav(false)
      setTimeout(() => navigate(match.path), 1200)
    } else {
      const botReply = { type: 'bot', text: "I'm not sure about that one — but here's what I can help you navigate:", id: Date.now() + 1 }
      setMessages(prev => [...prev, userMsg, botReply])
      setShowNav(true)
    }
  }

  return (
    <div className="concierge-chat-wrap">
      {/* Inline header + toggle */}
      <div className="cc-trigger-row">
        <div className="cc-trigger-info">
          <span className="cc-pulse" />
          <span className="cc-trigger-label">AI Concierge</span>
          <span className="cc-trigger-sub">Your guide to our services</span>
        </div>
        <button className="cc-toggle-btn" onClick={() => setOpen(v => !v)} aria-label="Toggle concierge chat">
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          )}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div className="cc-panel">
          <div className="cc-messages">
            {messages.map((msg, idx) =>
              msg.type === 'bot' ? (
                <BotMessage
                  key={msg.id}
                  text={msg.text}
                  onDone={
                    idx === 0 ? handleGreetingDone
                    : idx === 1 ? handleFollowUpDone
                    : undefined
                  }
                />
              ) : (
                <UserMessage key={msg.id} text={msg.text} />
              )
            )}

            {showNav && (
              <div className="cc-nav-options">
                {NAV_OPTIONS.map((opt) => (
                  <button key={opt.path} className="cc-nav-btn" onClick={() => handleNavClick(opt)}>
                    <span className="cc-nav-btn-label">{opt.label}</span>
                    <span className="cc-nav-btn-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form className="cc-input-row" onSubmit={handleInputSubmit}>
            <input
              className="cc-input"
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Ask me anything or type a service…"
              aria-label="Chat input"
            />
            <button className="cc-send-btn" type="submit" aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
