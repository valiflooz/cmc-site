import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, X, ArrowRight } from 'lucide-react'
import { useContent, mediaUrl } from '../content.jsx'
import SectionTitle from './SectionTitle.jsx'
import VideoModal from './VideoModal.jsx'
import VideoControlBar from './VideoControlBar.jsx'

// Encode each path segment so spaces (e.g. "Norway 1.jpg") work in CSS url()
const encodeVideoPath = (file) =>
  file.split('/').map(encodeURIComponent).join('/')

export default function Video() {
  const c = useContent('video')
  const projets = c.projets || []

  const [showModal,     setShowModal]     = useState(false)
  const [projIdx,       setProjIdx]       = useState(0)
  const [vidIdx,        setVidIdx]        = useState(0)
  const [playing,       setPlaying]       = useState(false)
  const [isMuted,       setIsMuted]       = useState(true)
  const [isFullscreen,  setIsFullscreen]  = useState(false)
  const [barVisible,    setBarVisible]    = useState(false)
  const videoRef   = useRef(null)
  const visualRef  = useRef(null)
  const idleTimer  = useRef(null)

  // Affiche la barre et planifie sa disparition après 3 s (en lecture)
  const showBar = useCallback((isPlaying) => {
    setBarVisible(true)
    clearTimeout(idleTimer.current)
    if (isPlaying) {
      idleTimer.current = setTimeout(() => setBarVisible(false), 3000)
    }
  }, [])

  // Toujours visible quand la vidéo est arrêtée ; disparaît quand elle joue et souris inactive
  useEffect(() => {
    if (!playing) {
      clearTimeout(idleTimer.current)
      setBarVisible(false)   // barre cachée quand arrêtée (le bouton Play suffit)
    }
  }, [playing])

  // Écoute les changements d'état plein écran (tous navigateurs)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange',       handler)
    document.addEventListener('webkitfullscreenchange', handler)
    document.addEventListener('mozfullscreenchange',    handler)
    document.addEventListener('msfullscreenchange',     handler)
    return () => {
      document.removeEventListener('fullscreenchange',       handler)
      document.removeEventListener('webkitfullscreenchange', handler)
      document.removeEventListener('mozfullscreenchange',    handler)
      document.removeEventListener('msfullscreenchange',     handler)
    }
  }, [])

  const projet     = projets[projIdx]
  const video      = projet?.videos?.[vidIdx]
  const description = projet?.description ?? ''

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // On passe le conteneur (pas <video>) pour que les boutons restent visibles
      const el = visualRef.current
      if (!el) return
      if (el.requestFullscreen)            el.requestFullscreen()
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
      else if (el.mozRequestFullScreen)    el.mozRequestFullScreen()
      else if (el.msRequestFullscreen)     el.msRequestFullscreen()
    } else {
      if (document.exitFullscreen)             document.exitFullscreen()
      else if (document.webkitExitFullscreen)  document.webkitExitFullscreen()
      else if (document.mozCancelFullScreen)   document.mozCancelFullScreen()
      else if (document.msExitFullscreen)      document.msExitFullscreen()
    }
  }

  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    if (videoRef.current) videoRef.current.muted = next
  }

  const handleMouseMove = () => { if (playing) showBar(true) }

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
    if (document.fullscreenElement) {
      if (document.exitFullscreen)            document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
      else if (document.mozCancelFullScreen)  document.mozCancelFullScreen()
      else if (document.msExitFullscreen)     document.msExitFullscreen()
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
    <>
    <section className="video-section" id="video">

      {/* ── Colonne gauche : visuel ──────────────────────── */}
      <div className="video-visual" ref={visualRef} onMouseMove={handleMouseMove}>

        <video
          key={video.fichier}
          ref={videoRef}
          className="video-player"
          poster={mediaUrl('video', encodeVideoPath(video.poster))}
          onEnded={handleEnded}
          onCanPlay={handleCanPlay}
          playsInline
          muted={isMuted}
        >
          <source src={mediaUrl('video', encodeVideoPath(video.fichier))} type="video/mp4" />
        </video>

        {/* Overlay sombre + fondu (masqué quand en lecture) */}
        <div className={`video-overlay${playing ? ' is-playing' : ''}`} />

        {/* Bouton Play */}
        {!playing && (
          <button className="play-btn" onClick={doPlay} aria-label="Play">
            <Play size={26} fill="currentColor" />
          </button>
        )}

        {/* Bouton Stop — visible en lecture OU en plein écran */}
        {(playing || isFullscreen) && (
          <button className="video-stop-btn" onClick={doStop} aria-label="Stop">
            <X size={20} />
          </button>
        )}

        {/* Barre de navigation — visible au mouvement de souris en lecture */}
        {playing && (
          <VideoControlBar
            videoRef={videoRef}
            videoKey={video.fichier}
            visible={barVisible}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
        )}

        {/* Sélecteur multi-vidéos (Norway) — visible en lecture */}
        {playing && projet.videos.length > 1 && (
          <div className="video-multi">
            {projet.videos.map((v, i) => (
              <button
                key={i}
                className={`video-multi-thumb${i === vidIdx ? ' active' : ''}`}
                onClick={() => switchVideo(i)}
                style={{ backgroundImage: `url(${mediaUrl('video', encodeVideoPath(v.poster))})` }}
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
          <button className="btn btn-outline" onClick={() => setShowModal(true)}>
            {c.bouton.label}
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
        </div>

        {/* Panneau description projet */}
        <div className="video-panel video-panel-desc">
          <p className="eyebrow">{projet.nom}</p>
          <p className="video-desc-text">{description}</p>
        </div>

      </div>
    </section>

    {showModal && (
      <VideoModal projets={projets} onClose={() => setShowModal(false)} />
    )}
    </>
  )
}
