import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const PHASE_ORDER = ['Concept', 'Manufacturing', 'Commissioning']
const PANEL_DUR = 200
const LB_DUR    = 160

export function projectImgUrl(path) {
  return '/content/projects/' + path.split('/').map(encodeURIComponent).join('/')
}

// "Brazil – Hyperbaric test chamber" → { titre: "Hyperbaric test chamber", lieu: "Brazil" }
// "Catamaran DSV offshore"           → { titre: "Catamaran DSV offshore",   lieu: null }
export function splitNom(nom) {
  const m = nom.match(/^(.+?)\s+[–\-]\s+(.+)$/)
  return m ? { titre: m[2], lieu: m[1] } : { titre: nom, lieu: null }
}

export default function ProjectModal({ project, onClose }) {
  const [activePhase, setActivePhase]     = useState(project.phases[0]?.nom || '')
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [panelClosing, setPanelClosing]   = useState(false)
  const [lbClosing, setLbClosing]         = useState(false)

  const { titre, lieu } = splitNom(project.nom)
  const orderedPhases   = PHASE_ORDER.filter(ph => project.phases.some(p => p.nom === ph))
  const currentPhotos   = project.phases.find(p => p.nom === activePhase)?.photos || []
  const photosRef       = useRef(currentPhotos)

  // ── Ferme le panneau principal avec animation ──
  const closePanel = useCallback(() => {
    setPanelClosing(true)
    setTimeout(onClose, PANEL_DUR)
  }, [onClose])

  // ── Ferme le lightbox avec animation ──
  const closeLightbox = useCallback(() => {
    setLbClosing(true)
    setTimeout(() => {
      setLightboxIndex(null)
      setLbClosing(false)
    }, LB_DUR)
  }, [])

  // Mise à jour ref photos + fermeture immédiate du lightbox au changement de phase
  useEffect(() => {
    photosRef.current = currentPhotos
    setLightboxIndex(null)   // pas d'animation, changement de phase
    currentPhotos.forEach(path => { new Image().src = projectImgUrl(path) })
  }, [activePhase]) // eslint-disable-line

  // Blocage du scroll body + précharge toutes les phases dès l'ouverture
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    project.phases.forEach(phase =>
      phase.photos.forEach(path => { new Image().src = projectImgUrl(path) })
    )
    return () => { document.body.style.overflow = '' }
  }, []) // eslint-disable-line

  // Précharge les photos adjacentes dans le lightbox
  useEffect(() => {
    if (lightboxIndex === null) return
    const photos = photosRef.current
    if (lightboxIndex > 0)
      new Image().src = projectImgUrl(photos[lightboxIndex - 1])
    if (lightboxIndex < photos.length - 1)
      new Image().src = projectImgUrl(photos[lightboxIndex + 1])
  }, [lightboxIndex])

  // Navigation clavier
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (lightboxIndex !== null) closeLightbox()
        else closePanel()
        return
      }
      if (lightboxIndex !== null) {
        if (e.key === 'ArrowRight') setLightboxIndex(i => Math.min(i + 1, photosRef.current.length - 1))
        if (e.key === 'ArrowLeft')  setLightboxIndex(i => Math.max(i - 1, 0))
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closePanel, closeLightbox, lightboxIndex])

  return (
    <>
      {/* ── Modal ─────────────────────────────────────── */}
      <div
        className={`modal-overlay${panelClosing ? ' is-closing' : ''}`}
        onClick={lightboxIndex !== null ? undefined : closePanel}
      >
        <div
          className={`modal-panel${panelClosing ? ' is-closing' : ''}`}
          onClick={e => e.stopPropagation()}
        >

          <div className="modal-header">
            <div>
              <h3 className="modal-title">{titre}</h3>
              {lieu && <p className="modal-lieu">{lieu}</p>}
            </div>
            <button className="modal-close" onClick={closePanel} aria-label="Close">
              <X size={22} />
            </button>
          </div>

          {orderedPhases.length > 1 && (
            <div className="modal-tabs">
              {orderedPhases.map(ph => (
                <button
                  key={ph}
                  className={`modal-tab${activePhase === ph ? ' active' : ''}`}
                  onClick={() => setActivePhase(ph)}
                >
                  {ph}
                </button>
              ))}
            </div>
          )}

          <div className="modal-body">
            {/* key = activePhase déclenche la ré-animation à chaque changement d'onglet */}
            <div className="modal-gallery" key={activePhase}>
              {currentPhotos.map((photo, i) => (
                <img
                  key={i}
                  src={projectImgUrl(photo)}
                  alt=""
                  className="modal-photo"
                  loading="lazy"
                  onClick={() => setLightboxIndex(i)}
                />
              ))}
            </div>

            {project.description && (
              <aside className="modal-description">
                <p>{project.description}</p>
                {project.partenaire && (
                  <p className="modal-partenaire">
                    {project.partenaire.label}{' '}
                    <a
                      href={`https://${project.partenaire.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="modal-partenaire-link"
                    >
                      {project.partenaire.url}
                    </a>
                  </p>
                )}
              </aside>
            )}
          </div>

        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────── */}
      {(lightboxIndex !== null || lbClosing) && (
        <div
          className={`lightbox-overlay${lbClosing ? ' is-closing' : ''}`}
          onClick={closeLightbox}
        >
          <button
            className="lightbox-nav lightbox-prev"
            onClick={e => { e.stopPropagation(); setLightboxIndex(i => Math.max(i - 1, 0)) }}
            disabled={lightboxIndex === 0}
            aria-label="Previous"
          >
            <ChevronLeft size={36} />
          </button>

          {/* key = lightboxIndex déclenche l'animation imgIn à chaque changement de photo */}
          <img
            key={lightboxIndex}
            src={projectImgUrl(currentPhotos[lightboxIndex ?? 0])}
            alt=""
            className="lightbox-img"
            onClick={e => e.stopPropagation()}
          />

          <button
            className="lightbox-nav lightbox-next"
            onClick={e => { e.stopPropagation(); setLightboxIndex(i => Math.min(i + 1, currentPhotos.length - 1)) }}
            disabled={lightboxIndex === currentPhotos.length - 1}
            aria-label="Next"
          >
            <ChevronRight size={36} />
          </button>

          <button
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <X size={22} />
          </button>

          <span className="lightbox-counter">
            {(lightboxIndex ?? 0) + 1} / {currentPhotos.length}
          </span>
        </div>
      )}
    </>
  )
}
