import { Link, useParams } from 'react-router-dom'

const OFFERS = [
  {
    id: 'presence-web-professionnelle',
    level: 1,
    title: 'Presence Web Professionnelle',
    price: '99 $ paiement unique',
    idealFor: 'Landing page, portfolio, page service, page evenement',
    support: 'Basic Care',
    intro:
      'Pour les clients qui veulent une page simple, propre et professionnelle afin de presenter une activite, un service, un evenement ou une marque.',
    included: [
      'Une page simple professionnelle',
      'Version mobile-friendly',
      'Section presentation, service et contact',
      'Liens reseaux sociaux',
      'Alignement visuel de base avec la marque',
      'Une ronde consolidee de revisions UI/UX avant livraison',
    ],
    excluded: [
      'Site multi-pages',
      'Systeme de reservation',
      'Paiement en ligne',
      'Base de donnees',
      'IA',
      'WhatsApp',
      'Refonte avancee',
      'Hebergement personnalise',
    ],
  },
  {
    id: 'application-web-starter',
    level: 2,
    title: 'Application Web Starter',
    price: '199 $ paiement unique',
    idealFor: 'Formulaire, inscription, portail simple, workflow business',
    support: 'Growth Care',
    intro:
      'Pour les clients qui ont besoin d une solution interactive simple : formulaire, inscription, demande de reservation, portail leger ou workflow business basique.',
    included: [
      'Configuration d une application web de base',
      'Workflow utilisateur simple',
      'Formulaire ou soumission de donnees',
      'Connexion frontend/backend de base',
      'Vue admin ou dashboard simple selon le besoin',
      'Tests avant livraison',
      'Une ronde consolidee de revisions UI/UX avant livraison',
    ],
    excluded: [
      'Paiement en ligne avance',
      'Roles utilisateurs complexes',
      'Automatisation avancee',
      'IA active',
      'WhatsApp Business',
      'Base de donnees avancee',
      'Dashboard complexe',
      'Application mobile',
    ],
  },
  {
    id: 'plateforme-saas-starter',
    level: 3,
    title: 'Plateforme SaaS Starter',
    price: '499 $ paiement unique',
    idealFor: 'MVP, portail client, dashboard, donnees, IA, abonnements',
    support: 'Platform Care',
    intro:
      'Pour les startups, organisations et entreprises qui veulent lancer une base de plateforme avec utilisateurs, donnees, dashboard, IA, abonnements ou evolutions futures.',
    included: [
      'Structure initiale de plateforme type SaaS',
      'Connexion frontend/backend de base',
      'Revue de connexion base de donnees',
      'Vue admin ou gestion simple',
      'Recommandation de roadmap',
      'Revue IA Basic',
      '10 000 tokens IA inclus pour test initial',
      'Tests avant livraison',
      'Une ronde consolidee de revisions UI/UX avant livraison',
    ],
    important:
      'L allocation IA incluse sert uniquement au test initial. L usage IA actif par des clients, utilisateurs ou abonnes est facture selon la consommation mensuelle.',
  },
  {
    id: 'shell-coquille-demo',
    level: 4,
    title: 'Shell / Coquille Demo',
    price: '299 $ paiement unique',
    idealFor: 'Demo live temporaire pour presenter une idee a des prospects',
    support: 'Option demo seulement',
    intro:
      'La Shell / Coquille est une version de demonstration live permettant au client de presenter une idee, tester un concept ou montrer une base fonctionnelle a des prospects avant de passer a une vraie phase de production.',
    included: [
      'Demo live temporaire',
      'Acces via le portail https://www.mysmartwork.tech/',
      'Structure visuelle et fonctionnelle de presentation',
      'Possibilite de montrer le concept a des prospects',
      '10 000 tokens IA inclus pour test initial',
      'Sandbox initial disponible pendant 14 jours',
    ],
    limitations: [
      'Inscription de vrais clients',
      'Onboarding d utilisateurs reels',
      'SLA ou engagement de disponibilite',
      'Integration WhatsApp en production',
      'IA en production',
      'Support continu inclus',
      'Hebergement personnalise inclus',
    ],
    dataStorage:
      'Sans configuration de base de donnees, les donnees de demonstration ne sont pas garanties et peuvent etre supprimees toutes les 24 heures.',
    dbAddon:
      'Configuration base de donnees simple : 49,99 $ paiement unique. Inclus : 2 GB d espace cloud pour usage de demonstration prolonge.',
    postPeriod:
      'Si aucun contrat, plan de support ou accord de continuation n est signe avec YNK TECH USA apres la periode initiale, l acces a la demo peut etre desactive.',
    domainHosting:
      'La Shell / Coquille est accessible uniquement via mysmartwork.tech. Pour un nom de domaine personnalise, un hebergement personnel ou une adresse de marque, des frais d hebergement, de configuration et de maintenance annuelle s appliquent.',
    revisions:
      'La Shell / Coquille peut etre revisee avec frais. Les ajustements UI/UX, changements de texte, couleurs, ecrans, parcours utilisateur ou logique de demonstration sont factures separement.',
  },
]

function OffersOverview() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">Services</span>
          <h1 className="section-title">Offres de demarrage</h1>
          <p className="section-subtitle">
            Ces offres permettent de commencer rapidement avec une base digitale claire.
            Les prix sont des tarifs de depart.
          </p>
        </div>
      </section>

      <section className="detail-section">
        <div className="container">
          <div className="offer-note">
            Les fonctionnalites avancees, integrations, revisions supplementaires,
            hebergement personnalise, base de donnees, IA active, WhatsApp, SMS et frais
            fournisseurs sont factures separement lorsqu ils s appliquent.
          </div>

          <div className="offer-summary-grid">
            {OFFERS.map((offer) => (
              <article className="offer-summary-card" key={offer.id}>
                <span className="project-tag">Niveau {offer.level}</span>
                <h3>{offer.title}</h3>
                <p className="offer-price">{offer.price}</p>
                <p>{offer.idealFor}</p>
                <div className="offer-meta-row">
                  <span>Support recommande</span>
                  <strong>{offer.support}</strong>
                </div>
                <Link to={`/it-services/offres/${offer.id}`} className="btn btn-secondary">
                  Voir details
                </Link>
              </article>
            ))}
          </div>

          <div className="detail-action" style={{ marginTop: '28px' }}>
            <Link to="/it-services" className="btn btn-secondary">
              Retour aux services IT
            </Link>
            <Link to="/request-quote?category=it" className="btn btn-primary" style={{ marginLeft: '12px' }}>
              Demander un devis
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function OfferDetail({ offer }) {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">Niveau {offer.level}</span>
          <h1 className="section-title">{offer.title}</h1>
          <p className="section-subtitle">{offer.intro}</p>
          <p className="offer-price" style={{ marginTop: '12px' }}>{offer.price}</p>
        </div>
      </section>

      <section className="detail-section">
        <div className="container">
          <div className="offer-meta-row offer-meta-banner">
            <span>Ideal pour</span>
            <strong>{offer.idealFor}</strong>
          </div>

          <div className="offer-detail-grid">
            <div className="offer-panel">
              <h2>Inclus</h2>
              <ul className="offer-list">
                {offer.included.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            {offer.excluded && (
              <div className="offer-panel">
                <h2>Non inclus</h2>
                <ul className="offer-list offer-list-muted">
                  {offer.excluded.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {offer.important && <div className="offer-warning">Important: {offer.important}</div>}

          {offer.limitations && (
            <div className="offer-panel" style={{ marginTop: '20px' }}>
              <h2>Limites importantes</h2>
              <p className="offer-body">La Shell / Coquille est une demo, pas une plateforme de production.</p>
              <ul className="offer-list offer-list-muted">
                {offer.limitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {offer.dataStorage && (
            <div className="offer-panel" style={{ marginTop: '20px' }}>
              <h2>Donnees et stockage</h2>
              <p className="offer-body">{offer.dataStorage}</p>
              <p className="offer-body">{offer.dbAddon}</p>
            </div>
          )}

          {offer.postPeriod && (
            <div className="offer-panel" style={{ marginTop: '20px' }}>
              <h2>Apres les 14 jours</h2>
              <p className="offer-body">{offer.postPeriod}</p>
            </div>
          )}

          {offer.domainHosting && (
            <div className="offer-panel" style={{ marginTop: '20px' }}>
              <h2>Domaine et hebergement personnalise</h2>
              <p className="offer-body">{offer.domainHosting}</p>
            </div>
          )}

          {offer.revisions && (
            <div className="offer-panel" style={{ marginTop: '20px' }}>
              <h2>Revisions</h2>
              <p className="offer-body">{offer.revisions}</p>
            </div>
          )}

          <div className="detail-action" style={{ marginTop: '28px' }}>
            <Link to="/it-services/offres" className="btn btn-secondary">
              Retour aux offres
            </Link>
            <Link to="/request-quote?category=it" className="btn btn-primary" style={{ marginLeft: '12px' }}>
              Demander un devis
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default function ServiceOffers() {
  const { offerId } = useParams()

  if (!offerId) {
    return <OffersOverview />
  }

  const offer = OFFERS.find((item) => item.id === offerId)

  if (!offer) {
    return (
      <section className="detail-section" style={{ paddingTop: '160px' }}>
        <div className="container">
          <h1 className="section-title">Offre introuvable</h1>
          <p className="section-subtitle">Cette page n existe pas ou a ete deplacee.</p>
          <div className="detail-action" style={{ marginTop: '20px' }}>
            <Link to="/it-services/offres" className="btn btn-secondary">Voir toutes les offres</Link>
          </div>
        </div>
      </section>
    )
  }

  return <OfferDetail offer={offer} />
}
