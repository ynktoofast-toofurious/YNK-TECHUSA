import { useState } from 'react'
import { askHub, intakeEnabled } from './intake'

// One conversation with Ask the Hub. Each assistant turn: { mode, text, sources } or { status: 'error' | 'busy' }.
export function useHubChat(language, { onReply } = {}) {
  const [turns, setTurns] = useState([])
  const [pending, setPending] = useState(false)

  const send = (question, restart = false) => {
    const text = question.trim()
    if (!text || pending) return
    const base = restart ? [] : turns
    const history = base.filter((t) => t.text && !t.status).map((t) => (t.sig ? { role: t.role, text: t.text, sig: t.sig } : { role: t.role, text: t.text })).slice(-6)
    setTurns([...base, { id: Date.now(), role: 'user', text }])
    setPending(true)
    const done = (reply) => {
      setTurns((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', ...reply }])
      setPending(false)
      if (onReply) onReply(base.filter((t) => t.role === 'assistant').length + 1)
    }
    if (!intakeEnabled) { done({ status: 'error' }); return }
    askHub(text, language, history)
      .then((res) => {
        if (!res || !res.ok) done({ status: res && res.error === 'rate_limited' ? 'busy' : 'error' })
        else done({ mode: res.mode, text: res.answer || '', sig: res.sig || '', sources: res.sources || [], action: res.action || null, question: text })
      })
      .catch(() => done({ status: 'error' }))
  }

  return { turns, pending, send, reset: () => setTurns([]) }
}
