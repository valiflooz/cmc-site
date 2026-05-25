import { useState, useRef } from 'react'
import { Play, X, ArrowRight } from 'lucide-react'
import { useContent, mediaUrl } from '../content.jsx'
import SectionTitle from './SectionTitle.jsx'

export default function Video() {
  const c = useContent('video')
  const projets = c.projets || []

  const [projIdx, setProjIdx]   = useState(0)
  const [vidIdx, setVidIdx]     = useState(0)
  const [playing, setPlaying]   = useState(false)
  const videoRef = useRef(null)

  const projet     = projets[projIdx]
  const video      = projet?.videos?.[vidIdx]
  const description = projet?.description ?? ''

  const doPlay = () => {
    setPlaying(true)
    videoRef.current?.play().catch(() => setPlaying(false))
  }

  const doStop = () => {
    setPlaying(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  const switchProject = (i) => {
    doStop()
    setProjIdx(i)
    setVidIdx(0)
  }

  const switchVideo = (i) => {
    setVidIdx(i)
    // onCanPlay lancera la lecture si playing=true
  }

  const handleCanPlay = () => {
    if (playing) videoRef.current?.play().catch(() => setPlaying(false))
  }

  const handleEnded = () => {
    const next = vidIdx + 1
    if (next < projet.videos.length) {
      switchVideo(next)   // lecture auto via onCanPlay
    } else {
      doStop()
    }
  }

  if (!projet || !video) return null

  return (
    <section className="video-section" id="video">

      {/* ── Colonne gauche : visuel ──────────────────────── */}
      <div className="video-visual">

        <video
          key={video.fichier}
          ref={videoRef}
          className="video-player"
          poster={mediaUrl('video', video.poster)}
          onEnded={handleEnded}
          onCanPlay={handleCanPlay}
          playsInline
        >
          <source src={mediaUrl('video', video.fichier)} type="video/mp4" />
        </video>

        {/* Overlay sombre + fondu (masqué quand en lecture) */}
        <div className={`video-overlay${playing ? ' is-playing' : ''}`} />

        {/* Bouton Play */}
        {!playing && (
          <button className="play-btn" onClick={doPlay} aria-label="Play">
            <Play size={26} fill="currentColor" />
          </button>
        )}

        {/* Bouton Stop */}
        {playing && (
          <button className="video-stop-btn" onClick={doStop} aria-label="Stop">
            <X size={20} />
          </button>
        )}

        {/* Sélecteur multi-vidéos (Norway) — visible en lecture */}
        {playing && projet.videos.length > 1 && (
          <div className="video-multi">
            {projet.videos.map((v, i) => (
              <button
                key={i}
                className={`video-multi-thumb${i === vidIdx ? ' active' : ''}`}
                onClick={() => switchVideo(i)}
                style={{ backgroundImage: `url(${mediaUrl('video', v.poster)})` }}
                aria-label={`Clip ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Onglets projets — toujours visibles en bas */}
        <div className="video-proj-tabs">
          {projets.map((p, i) => (
            <button
              key={i}
              className={`video-proj-tab${i === projIdx ? ' active' : ''}`}
              onClick={() => switchProject(i)}
            >
              {p.nom}
            </button>
          ))}
        </div>
      </div>

      {/* ── Colonne droite : texte avec slide ───────────── */}
      <div className={`video-text-wrap${playing ? ' is-playing' : ''}`}>

        {/* Panneau par défaut */}
        <div className="video-panel video-panel-promo">
          <p className="eyebrow">{c.eyebrow}</p>
          <SectionTitle titre={c.titre} />
          <p>{c.paragraphe}</p>
          <a href={c.bouton.ancre} className="btn btn-outline">
            {c.bouton.label}
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </a>
        </div>

        {/* Panneau description projet */}
        <div className="video-panel video-panel-desc">
          <p className="eyebrow">{projet.nom}</p>
          <p className="video-desc-text">{description}</p>
        </div>

      </div>
    </section>
  )
}
