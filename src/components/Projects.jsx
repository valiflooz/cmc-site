import { useState, useRef, useEffect } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useContent } from '../content.jsx'
import SectionTitle from './SectionTitle.jsx'
import ProjectModal, { projectImgUrl, splitNom } from './ProjectModal.jsx'
import AllProjectsModal from './AllProjectsModal.jsx'

export default function Projects() {
  const c = useContent('projects')
  const projets = c.projets
  const trackRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [step, setStep] = useState(0)
  const [perView, setPerView] = useState(4)
  const [activeProject,   setActiveProject]   = useState(null)
  const [showAllProjects, setShowAllProjects] = useState(false)

  // Précharge les photos d'un projet au survol de la carte
  const preloadProject = (p) => {
    new Image().src = projectImgUrl(p.cover)
    p.phases[0]?.photos.slice(0, 9).forEach(photo => {
      new Image().src = projectImgUrl(photo)
    })
  }

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current
      if (!track || !track.children.length) return
      const cardW = track.children[0].getBoundingClientRect().width
      const gap = parseFloat(getComputedStyle(track).gap) || 0
      const s = cardW + gap
      const viewport = track.parentElement.getBoundingClientRect().width
      setStep(s)
      setPerView(Math.max(1, Math.round((viewport + gap) / s)))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const maxIndex = Math.max(0, projets.length - perView)
  const safeIndex = Math.min(index, maxIndex)
  const go = (i) => setIndex(Math.min(maxIndex, Math.max(0, i)))

  return (
    <section className="projects" id="projects">
      <div className="container">
        <div className="projects-head">
          <div>
            <p className="eyebrow">{c.eyebrow}</p>
            <SectionTitle titre={c.titre} />
          </div>
          <button
            className="btn btn-outline"
            onClick={() => setShowAllProjects(true)}
          >
            {c.bouton.label}
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
        </div>

        <div className="projects-viewport">
          <div
            className="projects-track"
            ref={trackRef}
            style={{ transform: `translateX(${-safeIndex * step}px)` }}
          >
            {projets.map((p, i) => {
              const { titre, lieu } = splitNom(p.nom)
              return (
                <article
                  className="project-card"
                  key={i}
                  onClick={() => setActiveProject(p)}
                  onMouseEnter={() => preloadProject(p)}
                >
                  <div
                    className="project-thumb"
                    style={{
                      backgroundImage: `linear-gradient(160deg, rgba(11,22,32,.1), rgba(11,22,32,.45)), url(${projectImgUrl(p.cover)})`,
                    }}
                  />
                  <div className="project-body">
                    <h4>{titre}</h4>
                    {lieu && <p className="project-lieu">{lieu}</p>}
                    <p className="meta project-phases">
                      {p.phases.map(ph => ph.nom).join(' · ')}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <div className="dots">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              className={`dot${i === safeIndex ? ' active' : ''}`}
              onClick={() => go(i)}
              aria-label={`Go to group ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <button
        className="carousel-arrow prev"
        onClick={() => go(safeIndex - 1)}
        disabled={safeIndex === 0}
        aria-label="Previous"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        className="carousel-arrow next"
        onClick={() => go(safeIndex + 1)}
        disabled={safeIndex >= maxIndex}
        aria-label="Next"
      >
        <ChevronRight size={20} />
      </button>

      {activeProject && (
        <ProjectModal
          project={activeProject}
          onClose={() => setActiveProject(null)}
        />
      )}

      {showAllProjects && (
        <AllProjectsModal onClose={() => setShowAllProjects(false)} />
      )}
    </section>
  )
}
