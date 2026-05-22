import { Play, ArrowRight } from 'lucide-react'
import { useContent, mediaUrl } from '../content.jsx'
import SectionTitle from './SectionTitle.jsx'

export default function Video() {
  const c = useContent('video')

  return (
    <section className="video-section" id="video">
      <div
        className="video-visual"
        style={{
          backgroundImage: `linear-gradient(rgba(11,22,32,0.45), rgba(11,22,32,0.45)), url(${mediaUrl('video', c.poster)})`,
        }}
      >
        <button className="play-btn" aria-label="Lire la vidéo">
          <Play size={26} fill="currentColor" />
        </button>
      </div>

      <div className="video-text">
        <p className="eyebrow">{c.eyebrow}</p>
        <SectionTitle titre={c.titre} />
        <p>{c.paragraphe}</p>
        <a href={c.bouton.ancre} className="btn btn-outline">
          {c.bouton.label}
          <span className="btn-arrow"><ArrowRight size={16} /></span>
        </a>
      </div>
    </section>
  )
}
