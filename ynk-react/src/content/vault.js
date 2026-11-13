// Vault library. access: 'insider' (free with enrollment) | 'founding' (premium, not yet open).
// status: 'live' | 'soon' | 'research'. Only 'live' studies have a page.
export const STUDIES = [
  {
    id: 'drc-government',
    access: 'insider',
    status: 'live',
    date: '2026-04-28',
    minutes: 6,
    href: '/vault/drc-government',
    title: {
      en: 'Mapping the DRC Government: A Star-Schema Power Model',
      fr: 'Cartographier le gouvernement de la RDC : un modèle en étoile du pouvoir',
      es: 'Mapear el gobierno de la RDC: un modelo de poder en esquema estrella',
    },
    summary: {
      en: 'Who holds power, in which institution, and who reports to whom — the national government modeled as explorable data.',
      fr: 'Qui détient le pouvoir, dans quelle institution, et qui rend compte à qui — le gouvernement national modélisé en données explorables.',
      es: 'Quién tiene el poder, en qué institución y quién responde a quién — el gobierno nacional modelado como datos explorables.',
    },
  },
  {
    id: 'drc-dataset',
    access: 'founding',
    status: 'soon',
    title: {
      en: 'DRC government model — full dataset package',
      fr: 'Modèle du gouvernement de la RDC — jeu de données complet',
      es: 'Modelo del gobierno de la RDC — paquete de datos completo',
    },
    summary: {
      en: 'Every CSV table, relationship, and DAX measure, ready to load into Power BI.',
      fr: 'Toutes les tables CSV, relations et mesures DAX, prêtes à charger dans Power BI.',
      es: 'Todas las tablas CSV, relaciones y medidas DAX, listas para cargar en Power BI.',
    },
  },
  {
    id: 'economy-numbers',
    access: 'insider',
    status: 'research',
    title: {
      en: 'What do the numbers say about your world?',
      fr: 'Que disent les chiffres de votre monde ?',
      es: '¿Qué dicen los números sobre tu mundo?',
    },
    summary: {
      en: 'The trends behind costs, jobs, and opportunity — beyond the inflation headlines.',
      fr: 'Les tendances derrière les coûts, l’emploi et les opportunités — au-delà des gros titres sur l’inflation.',
      es: 'Las tendencias detrás de los costos, el empleo y las oportunidades — más allá de los titulares sobre inflación.',
    },
  },
  {
    id: 'ai-real-hype',
    access: 'insider',
    status: 'research',
    title: {
      en: 'AI: what’s real, what’s hype, and what’s next?',
      fr: 'IA : le réel, l’exagéré et la suite ?',
      es: 'IA: qué es real, qué es exageración y qué viene después',
    },
    summary: {
      en: 'Separating durable shifts from noise in emerging technology.',
      fr: 'Distinguer les évolutions durables du bruit dans les technologies émergentes.',
      es: 'Separar los cambios duraderos del ruido en la tecnología emergente.',
    },
  },
  {
    id: 'business-opportunities',
    access: 'founding',
    status: 'research',
    title: {
      en: 'Where are the next opportunities hiding?',
      fr: 'Où se cachent les prochaines opportunités ?',
      es: '¿Dónde se esconden las próximas oportunidades?',
    },
    summary: {
      en: 'An executive dossier on industry shifts, strategic choices, and public data signals.',
      fr: 'Un dossier exécutif sur les mutations sectorielles, les choix stratégiques et les signaux des données publiques.',
      es: 'Un dossier ejecutivo sobre cambios del sector, decisiones estratégicas y señales de datos públicos.',
    },
  },
]

const MEMBER_KEY = 'ynk-vault-member'

export function getMember() {
  try {
    const m = JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null')
    return m && m.tier ? m : null
  } catch {
    return null
  }
}

export function saveMember(member) {
  try { localStorage.setItem(MEMBER_KEY, JSON.stringify(member)) } catch { /* storage unavailable */ }
}

export function clearMember() {
  try { localStorage.removeItem(MEMBER_KEY) } catch { /* storage unavailable */ }
}
