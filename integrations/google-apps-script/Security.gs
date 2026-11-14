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
  skip: { action: true, html: true, token: true, trial: true, pass: true, code: true, website: true },
  // Free text that may span lines (newlines are expected there). Values never reach a mail header unflattened.
  multiline: { idea: true, reason: true, purpose: true, custom: true, refine: true, text: true, title: true },
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

// Only plain values at the top level, plus the two known lists (chat history and chosen topics).
function flatBody_(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false
  return Object.keys(body).every((k) => {
    if (!KEY_RE.test(k)) return false
    const v = body[k]
    if (k === 'history') return Array.isArray(v) && v.length <= 20 && v.every((h) => h && typeof h === 'object' && !Array.isArray(h) &&
      Object.keys(h).every((hk) => (hk === 'role' || hk === 'text') && typeof h[hk] === 'string'))
    if (k === 'topics') return Array.isArray(v) && v.length <= 10 && v.every((t) => typeof t === 'string')
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
  for (const k of Object.keys(body)) {
    if (SECURITY.skip[k]) continue
    const v = body[k]
    if (k === 'history') {
      for (const h of v) {
        const hit = check('text', h.text)
        if (hit) return { field: 'history', category: hit.category }
      }
    } else if (k === 'topics') {
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
