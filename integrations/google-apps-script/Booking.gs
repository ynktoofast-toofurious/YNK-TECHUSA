/**
 * YNK scheduling (replaces Calendly): visitors pick an open 30-minute slot on /book, the booking is stored in the
 * Bookings tab of the Editorial Queue, and both team inboxes plus the visitor get an email with a calendar invite (.ics).
 * Availability = weekly hours below, minus confirmed bookings and dates blocked in YNK Staging.
 */

const BOOKING = {
  tab: 'Bookings',
  headers: ['booking_id', 'created_at', 'start', 'end', 'name', 'email', 'company', 'topic', 'notes', 'language', 'visitor_tz', 'status', 'updated_at'],
  minutes: 30,
  weekdays: [1, 2, 3, 4, 5],
  from: [9, 0],
  to: [17, 0],
  noticeHours: 12,
  horizonDays: 21,
  perDay: 6,
  notify: ['yannicknkongolo7@gmail.com', 'snowfx44@gmail.com'],
  topics: { data: 'Data & BI', ai: 'AI experiences', web: 'Web & Cloud', brand: 'Brand & Creative', studio: 'Idea Studio prototype', other: 'Something else' },
}
const BOOKING_STATUS = ['CONFIRMED', 'DONE', 'CANCELLED']

const BOOK_MAIL = {
  en: { subject: 'Your YNK consultation: {when}', hello: 'Hello {name},', body: 'Your 30-minute consultation with YNK Tech is booked for <strong>{when}</strong> ({tz}).',
    link: 'Video link:', linkLater: 'We will email you the video link before the call.', invite: 'A calendar invite is attached.', change: 'Need to change it? Just reply to this email.', ref: 'Booking',
    cancelSubject: 'Your YNK consultation was cancelled', cancel: 'Your consultation planned for <strong>{when}</strong> ({tz}) was cancelled. You can pick a new time at any moment:', rebook: 'Book a new time' },
  fr: { subject: 'Votre consultation YNK\u00a0: {when}', hello: 'Bonjour {name},', body: 'Votre consultation de 30\u00a0minutes avec YNK Tech est r\u00e9serv\u00e9e pour le <strong>{when}</strong> ({tz}).',
    link: 'Lien vid\u00e9o\u00a0:', linkLater: 'Nous vous enverrons le lien vid\u00e9o avant l\u2019appel.', invite: 'Une invitation de calendrier est jointe.', change: 'Besoin de modifier\u00a0? R\u00e9pondez simplement \u00e0 cet e-mail.', ref: 'R\u00e9servation',
    cancelSubject: 'Votre consultation YNK a \u00e9t\u00e9 annul\u00e9e', cancel: 'Votre consultation pr\u00e9vue le <strong>{when}</strong> ({tz}) a \u00e9t\u00e9 annul\u00e9e. Vous pouvez choisir un nouveau cr\u00e9neau \u00e0 tout moment\u00a0:', rebook: 'Choisir un nouveau cr\u00e9neau' },
  es: { subject: 'Su consulta con YNK: {when}', hello: 'Hola {name}:', body: 'Su consulta de 30 minutos con YNK Tech est\u00e1 reservada para el <strong>{when}</strong> ({tz}).',
    link: 'Enlace de video:', linkLater: 'Le enviaremos el enlace de video antes de la llamada.', invite: 'Se adjunta una invitaci\u00f3n de calendario.', change: '\u00bfNecesita cambiarla? Responda a este correo.', ref: 'Reserva',
    cancelSubject: 'Su consulta con YNK fue cancelada', cancel: 'Su consulta prevista para el <strong>{when}</strong> ({tz}) fue cancelada. Puede elegir un nuevo horario cuando quiera:', rebook: 'Reservar otro horario' },
}
const BOOK_WHEN_FORMAT = { en: "EEE, MMM d, yyyy 'at' h:mm a", fr: 'dd/MM/yyyy HH:mm', es: 'dd/MM/yyyy HH:mm' }

/* ---------------- Public actions ---------------- */

function bookingSlotsAction_() {
  const cache = CacheService.getScriptCache()
  const hit = cache.get('bk:slots')
  if (hit) return JSON.parse(hit)
  const result = { ok: true, tz: Session.getScriptTimeZone(), minutes: BOOKING.minutes, slots: bookingSlots_().map((d) => d.toISOString()) }
  cache.put('bk:slots', JSON.stringify(result), 60)
  return result
}

function bookingBook_(b) {
  if (str_(b.website)) return { ok: true, id: 'YNK-MEET-0' }
  const name = cleanInput_(b.name, 100)
  const email = cleanInput_(b.email, 200).toLowerCase()
  const company = cleanInput_(b.company, 120)
  const topic = BOOKING.topics[str_(b.topic)] ? str_(b.topic) : ''
  const notes = str_(b.notes).replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ').slice(0, 1500)
  const lang = BOOK_MAIL[b.language] ? b.language : 'en'
  const visitorTz = bookingTz_(b.tz)
  const start = new Date(str_(b.start))
  if (!name || !validEmail_(email) || !topic || isNaN(start)) return { ok: false, error: 'invalid' }
  if (!rateLimit_('bk:all', 20, 3600) || !rateLimit_(`bk:${sha256_(email).slice(0, 20)}`, 2, 86400)) return { ok: false, error: 'rate_limited' }

  const lock = LockService.getScriptLock()
  lock.waitLock(15000)
  let id
  try {
    if (!bookingSlots_().some((s) => s.getTime() === start.getTime())) return { ok: false, error: 'taken' }
    id = `YNK-MEET-${Utilities.formatDate(start, 'UTC', 'yyyyMMdd')}-${Utilities.getUuid().slice(0, 4).toUpperCase()}`
    const end = new Date(start.getTime() + BOOKING.minutes * 60000)
    bookingSheet_().appendRow([id, new Date(), start, end, name, email, company, topic, notes, lang, visitorTz, 'CONFIRMED', ''].map(safeCell_))
    CacheService.getScriptCache().remove('bk:slots')
  } finally {
    lock.releaseLock()
  }
  bookingMail_({ id, start, name, email, company, topic, notes, lang, visitorTz })
  return { ok: true, id }
}

/* ---------------- Availability ---------------- */

// Open slot start times (Date, UTC instants) from now + notice to the horizon, in the team's time zone.
function bookingSlots_() {
  const tz = Session.getScriptTimeZone()
  const now = Date.now()
  const earliest = now + BOOKING.noticeHours * 3600000
  const blocked = bookingBlocked_()
  const taken = bookingRows_().filter((r) => r.status === 'CONFIRMED').map((r) => [new Date(r.start).getTime(), new Date(r.end).getTime()])
  const perDay = {}
  taken.forEach(([s]) => { const k = Utilities.formatDate(new Date(s), tz, 'yyyy-MM-dd'); perDay[k] = (perDay[k] || 0) + 1 })
  const seen = {}
  const slots = []
  for (let i = 0; i <= BOOKING.horizonDays; i++) {
    const day = Utilities.formatDate(new Date(now + i * 864e5), tz, 'yyyy-MM-dd')
    if (seen[day]) continue
    seen[day] = true
    const weekday = Number(Utilities.formatDate(new Date(now + i * 864e5), tz, 'u'))
    if (BOOKING.weekdays.indexOf(weekday) < 0 || blocked.indexOf(day) >= 0 || (perDay[day] || 0) >= BOOKING.perDay) continue
    const [y, m, d] = day.split('-').map(Number)
    const close = zonedTime_(y, m, d, BOOKING.to[0], BOOKING.to[1], tz)
    for (let t = zonedTime_(y, m, d, BOOKING.from[0], BOOKING.from[1], tz); t + BOOKING.minutes * 60000 <= close; t += BOOKING.minutes * 60000) {
      const end = t + BOOKING.minutes * 60000
      if (t < earliest) continue
      if (taken.some(([s, e]) => t < e && end > s)) continue
      slots.push(new Date(t))
    }
  }
  return slots
}

// Epoch ms for a wall-clock time in a time zone (handles daylight saving shifts).
function zonedTime_(y, m, d, h, min, tz) {
  const guess = Date.UTC(y, m - 1, d, h, min)
  const offset = (t) => {
    const z = Utilities.formatDate(new Date(t), tz, 'Z')
    return (z[0] === '-' ? -1 : 1) * (Number(z.slice(1, 3)) * 60 + Number(z.slice(3, 5))) * 60000
  }
  let t = guess - offset(guess)
  t = guess - offset(t)
  return t
}

function bookingTz_(tz) {
  const value = str_(tz)
  if (!/^[A-Za-z]+(?:\/[A-Za-z0-9_+-]+){0,2}$/.test(value) || value.length > 40) return Session.getScriptTimeZone()
  try {
    Utilities.formatDate(new Date(), value, 'Z')
    return value
  } catch (e) {
    return Session.getScriptTimeZone()
  }
}

function bookingBlocked_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('BOOKING_BLOCKED') || '[]').filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)) } catch (e) { return [] }
}

/* ---------------- Storage ---------------- */

function bookingSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.queueSheetId)
  let sheet = ss.getSheetByName(BOOKING.tab)
  if (!sheet) {
    sheet = ss.insertSheet(BOOKING.tab)
    sheet.getRange(1, 1, 1, BOOKING.headers.length).setValues([BOOKING.headers]).setFontWeight('bold')
    sheet.setFrozenRows(1)
  }
  return sheet
}

function bookingRows_() {
  const values = bookingSheet_().getDataRange().getValues()
  const headers = values[0].map(str_)
  return values.slice(1).map((cells, i) => {
    const obj = { rowNumber: i + 2 }
    headers.forEach((h, c) => { obj[h] = cells[c] })
    obj.booking_id = str_(obj.booking_id)
    obj.status = str_(obj.status).toUpperCase() || 'CONFIRMED'
    return obj
  }).filter((r) => r.booking_id)
}

/* ---------------- Email and calendar invite ---------------- */

function bookingWhen_(start, tz, lang) {
  return Utilities.formatDate(start, tz, BOOK_WHEN_FORMAT[lang] || BOOK_WHEN_FORMAT.en)
}

function icsText_(s) {
  return str_(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function bookingIcs_(m, method) {
  const stamp = (d) => Utilities.formatDate(d, 'UTC', "yyyyMMdd'T'HHmmss'Z'")
  const end = new Date(m.start.getTime() + BOOKING.minutes * 60000)
  const meet = str_(PropertiesService.getScriptProperties().getProperty('BOOKING_MEET_URL'))
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//YNK Tech USA//Booking//EN', `METHOD:${method}`, 'BEGIN:VEVENT',
    `UID:${m.id}@ynk-techusa.com`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(m.start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${icsText_(`YNK Tech consultation with ${m.name}`)}`,
    `DESCRIPTION:${icsText_(`Topic: ${BOOKING.topics[m.topic]}${m.notes ? `\n${m.notes}` : ''}\nBooking ${m.id}`)}`,
    `LOCATION:${icsText_(meet || 'Online video call (link sent by email)')}`,
    `ORGANIZER;CN=YNK Tech USA:mailto:${BOOKING.notify[0]}`,
    `ATTENDEE;CN=${icsText_(m.name)};RSVP=TRUE:mailto:${m.email}`,
    `STATUS:${method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}

function bookingMail_(m) {
  const teamTz = Session.getScriptTimeZone()
  const ics = Utilities.newBlob(bookingIcs_(m, 'REQUEST'), 'text/calendar', 'ynk-consultation.ics')
  const meet = str_(PropertiesService.getScriptProperties().getProperty('BOOKING_MEET_URL'))
  MailApp.sendEmail({
    to: BOOKING.notify.join(','),
    replyTo: m.email,
    name: 'YNK Tech USA',
    subject: oneLine_(`New booking: ${m.name}, ${bookingWhen_(m.start, teamTz, 'en')}`),
    htmlBody: [
      `<p>A consultation was booked on ynk-techusa.com/book. Reply to this email to reach ${esc_(m.name)}.</p>`,
      mailRows_([['When', `${bookingWhen_(m.start, teamTz, 'en')} (${teamTz})`], ['Visitor time', `${bookingWhen_(m.start, m.visitorTz, 'en')} (${m.visitorTz})`],
        ['Name', m.name], ['Email', m.email], ['Company', m.company || 'N/A'], ['Topic', BOOKING.topics[m.topic]], ['Language', m.lang], ['Booking', m.id]]),
      m.notes ? `<p><strong>Notes:</strong><br>${esc_(m.notes).replace(/\n/g, '<br>')}</p>` : '',
      meet ? '' : '<p>Remember to send the video link before the call.</p>',
    ].join(''),
    attachments: [ics],
  })
  const L = BOOK_MAIL[m.lang]
  const when = bookingWhen_(m.start, m.visitorTz, m.lang)
  sendMailWith_(m.email, L.subject.replace('{when}', when), [
    `<p>${esc_(L.hello.replace('{name}', m.name))}</p>`,
    `<p>${L.body.replace('{when}', esc_(when)).replace('{tz}', esc_(m.visitorTz))}</p>`,
    `<p>${meet ? `${L.link} <a href="${esc_(meet)}">${esc_(meet)}</a>` : L.linkLater}</p>`,
    `<p>${L.invite} ${L.change}</p>`,
    `<p style="color:#64748b;font-size:13px">${L.ref}: ${esc_(m.id)}</p>`,
    '<p>YNK Tech USA</p>',
  ].join(''), [ics], BOOKING.notify[0])
}

function sendMailWith_(to, subject, html, attachments, replyTo) {
  if (!validEmail_(str_(to))) return
  MailApp.sendEmail({ to: str_(to), subject: oneLine_(subject, 250), htmlBody: html, name: 'YNK Tech USA', attachments, replyTo })
}

/* ---------------- Console ---------------- */

function adminBookings() {
  assertAdmin_()
  const tz = Session.getScriptTimeZone()
  const now = Date.now()
  const rows = bookingRows_().map((r) => ({
    id: r.booking_id, start: new Date(r.start).getTime(), when: bookingWhen_(new Date(r.start), tz, 'en'), name: str_(r.name), email: str_(r.email),
    company: str_(r.company), topic: BOOKING.topics[str_(r.topic)] || str_(r.topic), notes: str_(r.notes), language: str_(r.language),
    visitorTz: str_(r.visitor_tz), status: r.status, created: fmtDate_(r.created_at, true),
  }))
  return {
    tz,
    upcoming: rows.filter((r) => r.start >= now - 3600000 && r.status === 'CONFIRMED').sort((a, b) => a.start - b.start),
    past: rows.filter((r) => !(r.start >= now - 3600000 && r.status === 'CONFIRMED')).sort((a, b) => b.start - a.start).slice(0, 50),
    blocked: bookingBlocked_().filter((d) => d >= Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd')).sort(),
    hours: `${BOOKING.weekdays.length === 5 ? 'Monday to Friday' : 'Selected days'}, ${BOOKING.from[0]}:00 to ${BOOKING.to[0]}:00, ${BOOKING.minutes}-minute slots, up to ${BOOKING.perDay} a day`,
  }
}

function adminSetBookingStatus(bookingId, status, note) {
  assertAdmin_()
  if (BOOKING_STATUS.indexOf(status) < 0) throw new Error('Unknown status.')
  const r = bookingRows_().find((x) => x.booking_id === str_(bookingId))
  if (!r) throw new Error('Booking not found.')
  const sheet = bookingSheet_()
  sheet.getRange(r.rowNumber, BOOKING.headers.indexOf('status') + 1).setValue(status)
  sheet.getRange(r.rowNumber, BOOKING.headers.indexOf('updated_at') + 1).setValue(new Date())
  CacheService.getScriptCache().remove('bk:slots')
  if (status === 'CANCELLED' && r.status === 'CONFIRMED') {
    const lang = BOOK_MAIL[str_(r.language)] ? str_(r.language) : 'en'
    const L = BOOK_MAIL[lang]
    const m = { id: r.booking_id, start: new Date(r.start), name: str_(r.name), email: str_(r.email), topic: str_(r.topic), notes: '' }
    const tz = bookingTz_(r.visitor_tz)
    sendMailWith_(m.email, L.cancelSubject, [
      `<p>${esc_(L.hello.replace('{name}', m.name))}</p>`,
      `<p>${L.cancel.replace('{when}', esc_(bookingWhen_(m.start, tz, lang))).replace('{tz}', esc_(tz))}</p>`,
      note ? `<p>${esc_(note)}</p>` : '',
      `<p><a href="${ADMIN.siteUrl}/book" style="display:inline-block;background:#29B5E8;color:#04121c;text-decoration:none;padding:10px 20px;border-radius:999px;font-weight:700">${L.rebook}</a></p>`,
      '<p>YNK Tech USA</p>',
    ].join(''), [Utilities.newBlob(bookingIcs_(m, 'CANCEL'), 'text/calendar', 'ynk-consultation.ics')], BOOKING.notify[0])
  }
  return adminBookings()
}

function adminBlockDate(date, blocked) {
  assertAdmin_()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str_(date))) throw new Error('Use a date like 2026-12-24.')
  const list = bookingBlocked_().filter((d) => d !== date)
  if (blocked) list.push(date)
  PropertiesService.getScriptProperties().setProperty('BOOKING_BLOCKED', JSON.stringify(list.sort()))
  CacheService.getScriptCache().remove('bk:slots')
  return adminBookings()
}
