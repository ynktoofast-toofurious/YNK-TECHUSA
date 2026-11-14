/**
 * Input firewall for the public intake (doPost).
 *
 * The backend has no SQL, NoSQL, LDAP, shell or XML parser, and every form value is stored as plain text and shown
 * with escaping, so these attacks have nothing to land on. This layer still refuses them at the door:
 * payloads that are not flat JSON (operator objects, prototype keys), oversized bodies, and text carrying
 * injection signatures. Blocked attempts are written to the Security_Log tab without any visitor identifier.
 */

const SECURITY = {
  maxBody: 150000,
  logTab: 'Security_Log',
  logHeaders: ['at', 'action', 'field', 'category', 'sample'],
  logPerDay: 300,
  // Fields that hold machine values; they are validated by strict patterns where they are used.
  skip: { action: true, html: true, token: true, trial: true, pass: true, code: true, website: true, job: true },
  // Free text that may span lines (newlines are expected there). Values never reach a mail header unflattened.
  multiline: { idea: true, reason: true, purpose: true, custom: true, refine: true, text: true, title: true, outcome: true, message: true, notes: true },
  // Text that only goes to the AI as data and is shown back as plain text: a match is logged, not refused,
  // so visitors can still ask about these attacks. Prompt attacks on these fields are handled by aiGuard_.
  aiText: { q: true, history: true, idea: true, refine: true },
}

const KEY_RE = /^[A-Za-z][A-Za-z0-9_]{0,40}$/

// Signatures are specific on purpose so ordinary ideas and questions ("dogs; cat toys", "union members") pass.
const THREATS = [
  ['sql', /['"`]\s*(?:or|and)\s+['"`]?[\w-]+['"`]?\s*(?:=|<>|!=|\blike\b)|['"`]\s*(?:or|and)\s+(?:true|false|\d+)\s*(?:--|#|\/\*|;)|\bunion\s+(?:all\s+)?select\b|;\s*(?:(?:drop|truncate|alter)\s+(?:table|database|schema|user)\b|delete\s+from\b|insert\s+into\b|update\s+\w+\s+set\b|exec(?:ute)?\s+\w|shutdown\b)|['"`]\s*\)?\s*;\s*(?:--|#|\/\*)|['"`]\s*--\s*$|\b(?:sleep|pg_sleep|benchmark)\s*\(\s*\d+\s*[,)]|\bwaitfor\s+delay\b|\bxp_cmdshell\b|\binformation_schema\b|\bload_file\s*\(/i],
  ['nosql', /\$(?:where|ne|eq|gt|gte|lt|lte|regex|in|nin|or|and|not|nor|exists|expr|function|elemMatch)\b|\{\s*["']?\$[a-z]+/i],
  ['xss', /<\s*\/?\s*(?:script|iframe|frame|object|embed|svg|img|math|style|link|meta|base|form|body|video|audio|details|marquee|input|button|textarea)\b|(?:java|vb)script\s*:\s*(?:\/\/|[a-z_$][\w$.]*\s*\(|alert|eval|document\.|window\.|void\b|this\.)|\bon(?:load|error|click|dblclick|mouse\w+|focus\w*|blur|key\w+|submit|change|input|toggle|animation\w+|pointer\w+|begin|end|wheel|scroll|copy|paste|drag\w*|drop|unload|beforeunload|message|show|start)\s*=|data\s*:\s*text\/html|&#x?0*(?:60|3c)\b|\\u003c|%3c\s*\/?\s*script/i],
  ['template', /\{\{[\s\S]{0,200}?\}\}|\{%[\s\S]{0,200}?%\}|\$\{[\s\S]{0,200}?\}|<%[\s\S]{0,200}?%>|#\{[\s\S]{0,200}?\}|<\?(?:php|=)|\*\{[\s\S]{0,200}?\}|__(?:class|globals|builtins|import|subclasses|mro)__/i],
  ['command', /(?:;|&&|\|\|?|`|\$\()\s*(?:rm\s+-[rf]|cat\s+[\/~.]|ls\s+[-\/~]|wget\s+\S|curl\s+\S|nc\s+-|ncat\s|bash\s+-|sh\s+-c|powershell\s|pwsh\s|cmd(?:\.exe)?\s+\/c|python\d?\s+-c|perl\s+-e|ruby\s+-e|php\s+-r|whoami\b|uname\s+-a|chmod\s+[0-7+]|sudo\s|ping\s+-[cn]|nslookup\s|certutil\s|mshta\s|rundll32\s|regsvr32\s)|\/bin\/(?:ba)?sh\b|\bcmd\.exe\b|\bsystem32\b/i],
  ['path', /\.\.[\/\\]|%2e%2e(?:%2f|%5c|\/|\\)|\.\.%2f|\.\.%5c|%252e%252e|\/etc\/(?:passwd|shadow|hosts)\b|\b[a-z]:\\(?:windows|users|boot)\\|%00|\u0000|\bfile:\/\//i],
  ['header', /%0[ad]|\\r\\n|\\n\\r/i],
  ['ldap', /\*\)\s*\(|\)\s*\(\s*[|&!]|\(\s*[|&!]\s*\(|\(\s*(?:uid|cn|mail|objectclass|userpassword|sn|ou|dc)\s*=\s*\*/i],
  ['xml', /<!\s*(?:doctype|entity|element|attlist)\b|<\?xml\b|\b(?:php|expect|gopher|jar|netdoc):\/\//i],
]

// Only plain values at the top level, plus the known lists (chat history, chosen topics, project tracks).
function flatBody_(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false
  return Object.keys(body).every((k) => {
    if (!KEY_RE.test(k)) return false
    const v = body[k]
    if (k === 'history') return Array.isArray(v) && v.length <= 20 && v.every((h) => h && typeof h === 'object' && !Array.isArray(h) &&
      Object.keys(h).every((hk) => (hk === 'role' || hk === 'text' || hk === 'sig') && typeof h[hk] === 'string'))
    if (k === 'topics' || k === 'tracks') return Array.isArray(v) && v.length <= 10 && v.every((t) => typeof t === 'string')
    return v == null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
  })
}

// Returns { field, category } for the first value that carries an injection signature, otherwise null.
function scanBody_(body) {
  const check = (field, value) => {
    if (typeof value !== 'string' || !value) return null
    for (const [category, re] of THREATS) {
      if (re.test(value)) return { field, category }
    }
    if (!SECURITY.multiline[field] && /[\r\n\u2028\u2029]/.test(value)) return { field, category: 'header' }
    return null
  }
  // AI-text fields last, so a refused field is always reported before a merely flagged one.
  const keys = Object.keys(body).sort((a, b) => Number(Boolean(SECURITY.aiText[a])) - Number(Boolean(SECURITY.aiText[b])))
  for (const k of keys) {
    if (SECURITY.skip[k]) continue
    const v = body[k]
    if (k === 'history') {
      for (const h of v) {
        const hit = check('text', h.text)
        if (hit) return { field: 'history', category: hit.category }
      }
    } else if (k === 'topics' || k === 'tracks') {
      for (const t of v) {
        const hit = check('topics', t)
        if (hit) return hit
      }
    } else {
      const hit = check(k, v)
      if (hit) return hit
    }
  }
  return null
}

function securityLog_(action, field, category, sample) {
  try {
    if (!rateLimit_('sec:log', SECURITY.logPerDay, 86400)) return
    const ss = SpreadsheetApp.openById(CONFIG.queueSheetId)
    let sheet = ss.getSheetByName(SECURITY.logTab)
    if (!sheet) {
      sheet = ss.insertSheet(SECURITY.logTab)
      sheet.getRange(1, 1, 1, SECURITY.logHeaders.length).setValues([SECURITY.logHeaders]).setFontWeight('bold')
      sheet.setFrozenRows(1)
    }
    const clean = (s, max) => str_(s).replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, max)
    sheet.appendRow([new Date(), clean(action, 30), clean(field, 30), category, clean(sample, 160)].map(safeCell_))
  } catch (e) {
    console.warn(`Security log failed: ${e.message || e}`)
  }
}

function securitySummary_() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.queueSheetId).getSheetByName(SECURITY.logTab)
    if (!sheet || sheet.getLastRow() < 2) return { week: 0, categories: {} }
    const since = Date.now() - 7 * 864e5
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues()
    const categories = {}
    let week = 0
    rows.forEach((r) => {
      const at = r[0] instanceof Date ? r[0].getTime() : new Date(r[0]).getTime()
      if (at >= since) {
        week += 1
        categories[str_(r[3])] = (categories[str_(r[3])] || 0) + 1
      }
    })
    return { week, categories }
  } catch (e) {
    return { week: 0, categories: {} }
  }
}

function validEmail_(email) {
  return typeof email === 'string' && email.length <= 254 &&
    /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,24}$/.test(email)
}

// Mail subjects and display names must stay on one line so nobody can add headers or recipients.
function oneLine_(s, max) {
  return str_(s).replace(/[\u0000-\u001F\u007F\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 200)
}

/* ---------------- AI guard (Ask the Hub, Idea Studio) ---------------- */

// Patterns run on lowercased text without accents or zero-width characters, in English, French and Spanish.
const AI_GUARD = [
  ['jailbreak', /\b(ignore|disregard|forget|override|bypass|skip)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all|any|your|the|system|these|those|initial|original)\b[^.\n]{0,30}\b(instruction|rule|prompt|guideline|direction|polic|constraint|guardrail|restriction)/],
  ['jailbreak', /\b(you are now|from now on,? you|pretend (to be|you are|that you)|role-?play as|developer mode|dan mode|do anything now|jailbreak|unfiltered mode|god mode|sudo mode|admin mode)\b/],
  ['jailbreak', /\b(respond|answer|reply|talk)\b[^.\n]{0,20}\bwithout\b[^.\n]{0,15}\b(restriction|limit|filter|rule|censorship|guideline)|\bnew (instructions?|rules|system prompt)\s*:/],
  ['jailbreak', /\b(ignore[zr]?|oublie[zr]?|contourne[zr]?|ignora|olvida|omite)\b[^.\n]{0,40}\b(instruction|consigne|regle|instruccion|regla|indicacion)|\b(a partir de maintenant,? tu es|tu es maintenant|ahora eres|a partir de ahora eres)\b/],
  ['extraction', /\b(system|hidden|initial|original|developer|secret|internal|backend)\s+(prompt|instruction|message|rule|guideline|configuration)/, 'ask'],
  ['extraction', /\b(reveal|show|print|repeat|output|display|dump|leak|tell me|give me|list|share)\b[^.\n]{0,40}\b(your|the|these|those|all)\s+(instruction|prompt|rule|guideline|configuration|setting)/],
  ['extraction', /\b(repeat|print|output)\b[^.\n]{0,20}\b(text|words|everything|content)\b[^.\n]{0,10}\b(above|before|so far)|\bwhat (were|are) you (told|instructed|programmed)/],
  ['extraction', /\b(prompt systeme|instructions? (cachee|systeme|initiales?)|prompt del sistema|instrucciones (ocultas|del sistema|iniciales))|\b(montre|revele|muestra|revela)\w*\b[^.\n]{0,30}\b(tes|vos|tus|sus) (instructions|regles|instrucciones|reglas)/],
  ['secrets', /\b(reveal|show|give|list|print|send|leak|dump|share|tell me)\b[^.\n]{0,40}\b(api ?keys?|secret keys?|tokens?|passwords?|credentials|env(ironment)? variables?|script propert|private data|personal data|email addresses|emails of|phone numbers of|user data|visitor data|customer data|database)/],
  ['secrets', /\b(donne|montre|revele|liste|dame|muestra|revela|lista)\w*\b[^.\n]{0,40}\b(cle api|mot de passe|donnees (personnelles|des utilisateurs)|clave api|contrasena|datos (personales|de (los )?usuarios))/],
  ['tool', /\b(call|invoke|run|execute|trigger)\b[^.\n]{0,20}\b(function|tool|plugin|endpoint|webhook)\b|\b(grant|give) me (full |admin )?(access|admin|a pass|a code)\b|\bapprove (my|this) (request|access)\b|\bissue (a |me a )?(pass|refund|code|ticket)\b/, 'ask'],
]
const AI_DELIMITER = /<\|[^|>]{0,30}\|>|\|\s*(im_start|im_end|endoftext)\s*\||\[\/?(inst|sys|system)\]|<<\/?sys>>|<\/?\s*(system|assistant|developer|instructions?|im_start|im_end)\s*>|^\s*#{2,}\s*(system|instructions?|assistant|developer)\b|^\s*(system|developer)\s*:|\b(begin|end)\s+(system|prompt|instructions)\b|"role"\s*:\s*"(system|developer|assistant)"/im
const AI_REFUSAL = {
  en: 'I can only help with questions about the YNK Tech Hub, its research and its services. Ask me about an article, a study, or a project you want to build.',
  fr: 'Je peux seulement vous aider sur le YNK Tech Hub, ses recherches et ses services. Posez-moi une question sur un article, une \u00e9tude ou un projet que vous souhaitez construire.',
  es: 'Solo puedo ayudarle con preguntas sobre el YNK Tech Hub, sus investigaciones y sus servicios. Preg\u00fanteme por un art\u00edculo, un estudio o un proyecto que quiera construir.',
}

function aiNormalize_(text) {
  return str_(text).normalize('NFKC').replace(/[\u200B-\u200F\u2060\uFEFF\u00AD]/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Returns the kind of prompt attack found ('jailbreak', 'extraction', 'delimiter', 'secrets', 'tool', 'encoded') or ''.
function aiGuard_(text, context) {
  const raw = str_(text)
  if (AI_DELIMITER.test(raw)) return 'delimiter'
  if (/[A-Za-z0-9+\/]{160,}={0,2}/.test(raw)) return 'encoded'
  const norm = aiNormalize_(raw)
  for (const [kind, re, only] of AI_GUARD) {
    if (only && only !== context) continue
    if (re.test(norm)) return kind
  }
  return ''
}

// Long repeated strings only inflate the bill; real questions and ideas never look like this.
function aiFlood_(text) {
  const s = str_(text)
  if (s.length < 120) return false
  if (/(.)\1{40,}/.test(s) || /(.{2,20}?)\1{15,}/.test(s)) return true
  return new Set(s.toLowerCase().replace(/\s+/g, '')).size < 8
}

// Retrieved passages are data: drop markup that imitates chat roles and sentences that address the assistant.
function aiScrub_(text) {
  return str_(text)
    .replace(new RegExp(AI_DELIMITER.source, 'gim'), ' ')
    .split(/(?<=[.!?\n])\s+/)
    .filter((sentence) => !aiGuard_(sentence, 'ask'))
    .join(' ')
}

function aiSign_(text) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(`ai|${text}`, accessSecret_())).replace(/=+$/, '').slice(0, 22)
}

function aiCanary_() {
  return `YNK-${Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase()}`
}

// True when the output carries the canary or a full sentence of the hidden instructions.
function aiLeak_(output, system, canary) {
  const out = aiNormalize_(output)
  if (canary && out.indexOf(canary.toLowerCase()) >= 0) return true
  return aiNormalize_(system).split(/(?<=[.:])\s+/).some((s) => s.length >= 48 && out.indexOf(s.slice(0, 80)) >= 0)
}

const AI_SECRET_RE = [
  /\bsk-[A-Za-z0-9_-]{16,}/g, /\bAIza[0-9A-Za-z_-]{30,}/g, /\bgh[pousr]_[A-Za-z0-9]{20,}/g, /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/g, /\bAKIA[0-9A-Z]{16}\b/g, /\bBearer\s+[A-Za-z0-9._-]{20,}/gi,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
]

// Answers are shown as plain text: no markup, no keys, and no email address other than the public contact.
function aiRedact_(text) {
  let out = str_(text).replace(/<[^>]{0,300}>/g, ' ').replace(/\b(?:javascript|vbscript|data)\s*:/gi, '')
  AI_SECRET_RE.forEach((re) => { out = out.replace(re, '[redacted]') })
  return out.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (m) => (m.toLowerCase() === ADMIN.notifyEmail ? m : '[email]'))
}
