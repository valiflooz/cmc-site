import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { useContent } from '../content.jsx'
import ProjectModal, { projectImgUrl, splitNom } from './ProjectModal.jsx'

const CLOSE_DURATION = 200

export default function AllProjectsModal({ onClose }) {
  const c = useContent('projects')
  const projets = c.projets
  const [activeProject, setActiveProject] = useState(null)
  const [closing, setClosing] = useState(false)

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, CLOSE_DURATION)
  }, [onClose])

  // Blocage scroll + touche Escape
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape' && !activeProject) handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [handleClose, activeProject])

  return (
    <>
      <div
        className={`modal-overlay all-projects-overlay${closing ? ' is-closing' : ''}`}
        onClick={handleClose}
      >
        <div
          className={`modal-panel all-projects-panel${closing ? ' is-closing' : ''}${activeProject ? ' has-active' : ''}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <h3 className="modal-title">{c.bouton.label}</h3>
            <button className="modal-close" onClick={handleClose} aria-label="Close">
              <X size={22} />
            </button>
          </div>

          {/* Grille de tous les projets */}
          <div className="all-projects-grid">
            {projets.map((p, i) => {
              const { titre, lieu } = splitNom(p.nom)
              return (
                <article
                  key={i}
                  className="all-projects-card"
                  onClick={() => setActiveProject(p)}
                >
                  <div
                    className="all-projects-thumb"
                    style={{
                      backgroundImage: `linear-gradient(160deg, rgba(11,22,32,.08), rgba(11,22,32,.5)), url(${projectImgUrl(p.cover)})`,
                    }}
                  />
                  <div className="all-projects-body">
                    <h4 className="all-projects-title">{titre}</h4>
                    {lieu && <p className="all-projects-lieu">{lieu}</p>}
                    <p className="meta all-projects-phases">
                      {p.phases.map(ph => ph.nom).join(' · ')}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal projet individuel par-dessus */}
      {activeProject && (
        <ProjectModal
          project={activeProject}
          onClose={() => setActiveProject(null)}
        />
      )}
    </>
  )
}
