import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const PHASE_ORDER = ['Concept', 'Manufacturing', 'Commissioning']

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
  const [activePhase, setActivePhase]   = useState(project.phases[0]?.nom || '')
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const { titre, lieu } = splitNom(project.nom)
  const orderedPhases   = PHASE_ORDER.filter(ph => project.phases.some(p => p.nom === ph))
  const currentPhotos   = project.phases.find(p => p.nom === activePhase)?.photos || []
  const photosRef       = useRef(currentPhotos)

  // Ferme le lightbox et précharge toutes les photos de la phase active
  useEffect(() => {
    photosRef.current = currentPhotos
    setLightboxIndex(null)
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
        if (lightboxIndex !== null) setLightboxIndex(null)
        else onClose()
        return
      }
      if (lightboxIndex !== null) {
        if (e.key === 'ArrowRight') setLightboxIndex(i => Math.min(i + 1, photosRef.current.length - 1))
        if (e.key === 'ArrowLeft')  setLightboxIndex(i => Math.max(i - 1, 0))
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, lightboxIndex])

  return (
    <>
      {/* ── Modal ─────────────────────────────────────── */}
      <div
        className="modal-overlay"
        onClick={lightboxIndex !== null ? undefined : onClose}
      >
        <div className="modal-panel" onClick={e => e.stopPropagation()}>

          <div className="modal-header">
            <div>
              <h3 className="modal-title">{titre}</h3>
              {lieu && <p className="modal-lieu">{lieu}</p>}
            </div>
            <button className="modal-close" onClick={onClose} aria-label="Close">
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
            <div className="modal-gallery">
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
              </aside>
            )}
          </div>

        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────── */}
      {lightboxIndex !== null && (
        <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
          <button
            className="lightbox-nav lightbox-prev"
            onClick={e => { e.stopPropagation(); setLightboxIndex(i => Math.max(i - 1, 0)) }}
            disabled={lightboxIndex === 0}
            aria-label="Previous"
          >
            <ChevronLeft size={36} />
          </button>

          <img
            src={projectImgUrl(currentPhotos[lightboxIndex])}
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
            onClick={() => setLightboxIndex(null)}
            aria-label="Close lightbox"
          >
            <X size={22} />
          </button>

          <span className="lightbox-counter">
            {lightboxIndex + 1} / {currentPhotos.length}
          </span>
        </div>
      )}
    </>
  )
}
