// Newest first. To publish: add an entry at the top. `native: true` = plain link outside the React app.
// Tags may be plain strings or { en, fr, es } objects.
export const LATEST = [
  {
    id: 'intelligence-hub',
    type: 'release',
    date: '2026-11-12',
    href: '/#intelligence',
    tags: [{ en: 'Platform', fr: 'Plateforme', es: 'Plataforma' }, 'EN · FR · ES'],
    title: {
      en: 'The YNK Intelligence Hub is live',
      fr: 'Le Hub d’Intelligence YNK est en ligne',
      es: 'El Hub de Inteligencia YNK ya está en línea',
    },
    summary: {
      en: 'A new home for curious minds: the Intelligence Desk, the YNK Method, and a first look at the Insider Vault, in English, French, and Spanish.',
      fr: 'Un nouvel espace pour les esprits curieux : le Bureau de l’Intelligence, la Méthode YNK et un premier aperçu du Coffre des initiés, en anglais, français et espagnol.',
      es: 'Un nuevo hogar para mentes curiosas: la Mesa de Inteligencia, el Método YNK y un primer vistazo a la Bóveda Interna, en inglés, francés y español.',
    },
  },
  {
    id: 'yb-orders-pipeline',
    type: 'engineering',
    date: '2026-05-16',
    href: '/yb-Printing/',
    native: true,
    tags: ['AWS Lambda', 'API Gateway', 'S3'],
    title: {
      en: 'Serverless order pipeline for YB Printing',
      fr: 'Pipeline de commandes serverless pour YB Printing',
      es: 'Pipeline de pedidos serverless para YB Printing',
    },
    summary: {
      en: 'Custom apparel orders now flow through a serverless API on AWS Lambda and API Gateway, landing directly in cloud storage. No servers to manage.',
      fr: 'Les commandes de vêtements personnalisés passent désormais par une API serverless sur AWS Lambda et API Gateway, directement stockées dans le cloud, sans serveur à gérer.',
      es: 'Los pedidos de ropa personalizada ahora pasan por una API serverless en AWS Lambda y API Gateway, y se guardan directamente en la nube, sin servidores que administrar.',
    },
  },
  {
    id: 'yb-printing',
    type: 'release',
    date: '2026-05-15',
    href: '/yb-Printing/',
    native: true,
    tags: ['E-commerce', { en: 'Brand', fr: 'Marque', es: 'Marca' }],
    title: {
      en: 'YB Printing storefront launches',
      fr: 'Lancement de la boutique YB Printing',
      es: 'Lanzamiento de la tienda YB Printing',
    },
    summary: {
      en: 'A dedicated storefront for custom apparel and printing, now live inside the YNK ecosystem.',
      fr: 'Une boutique dédiée aux vêtements personnalisés et à l’impression, désormais intégrée à l’écosystème YNK.',
      es: 'Una tienda dedicada a ropa personalizada e impresión, ahora integrada en el ecosistema YNK.',
    },
  },
  {
    id: 'drc-government-model',
    type: 'analysis',
    date: '2026-04-28',
    href: '/vault/drc-government',
    vault: true,
    tags: ['Power BI', 'Star Schema', { en: 'Politics', fr: 'Politique', es: 'Política' }],
    title: {
      en: 'Mapping the DRC government: a star-schema power model',
      fr: 'Cartographier le gouvernement de la RDC : un modèle en étoile du pouvoir',
      es: 'Mapear el gobierno de la RDC: un modelo de poder en esquema estrella',
    },
    summary: {
      en: 'A Power BI–ready model of the Democratic Republic of the Congo’s national government (the Suminwa II cabinet plus parliament, judiciary, provincial, and local structures), with a hierarchy view of who sits where.',
      fr: 'Un modèle prêt pour Power BI du gouvernement national de la République démocratique du Congo (le cabinet Suminwa II ainsi que les structures parlementaires, judiciaires, provinciales et locales), avec une vue hiérarchique des postes.',
      es: 'Un modelo listo para Power BI del gobierno nacional de la República Democrática del Congo (el gabinete Suminwa II y las estructuras parlamentarias, judiciales, provinciales y locales), con una vista jerárquica de quién ocupa cada cargo.',
    },
  },
  {
    id: 'ynk-assistant',
    type: 'release',
    date: '2026-04-20',
    href: '/#solutions',
    tags: ['Conversational UX', '3D'],
    title: {
      en: 'Meet the YNK assistant',
      fr: 'Découvrez l’assistant YNK',
      es: 'Conoce al asistente YNK',
    },
    summary: {
      en: 'An interactive concierge, paired with our signature 3D sphere, that answers common questions and points visitors to the right next step.',
      fr: 'Un concierge interactif, associé à notre sphère 3D signature, qui répond aux questions courantes et oriente les visiteurs vers la bonne étape.',
      es: 'Un conserje interactivo, junto a nuestra esfera 3D característica, que responde preguntas frecuentes y guía a los visitantes al siguiente paso.',
    },
  },
]

export const LATEST_TYPES = ['analysis', 'release', 'engineering']

const SEEN_KEY = 'ynk-latest-seen'
const NEW_WINDOW_MS = 45 * 24 * 60 * 60 * 1000
const LOADED_AT = Date.now()

export function isRecent(date) {
  return LOADED_AT - new Date(`${date}T12:00:00`).getTime() < NEW_WINDOW_MS
}

export function tagLabel(tag, language) {
  return typeof tag === 'string' ? tag : tag[language] || tag.en
}

export function formatDate(date, language) {
  return new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`))
}

export function hasUnseenLatest() {
  try {
    return (localStorage.getItem(SEEN_KEY) || '') < LATEST[0].date
  } catch {
    return false
  }
}

export function markLatestSeen() {
  try {
    localStorage.setItem(SEEN_KEY, LATEST[0].date)
  } catch { /* storage unavailable */ }
}
