import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Play, ChevronRight } from 'lucide-react'
import { mediaUrl } from '../content.jsx'

const encodeVideoPath = (file) =>
  file.split('/').map(encodeURIComponent).join('/')

export default function VideoModal({ projets, onClose }) {
  const [projIdx, setProjIdx] = useState(0)
  const [vidIdx,  setVidIdx]  = useState(0)
  const [playing, setPlaying] = useState(false)
  const [closing, setClosing] = useState(false)
  const videoRef = useRef(null)

  const projet = projets[projIdx]
  const video  = projet?.videos?.[vidIdx]

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 220)
  }, [onClose])

  // Fermeture par Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleClose])

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
  }

  const handleCanPlay = () => {
    if (playing) videoRef.current?.play().catch(() => setPlaying(false))
  }

  const handleEnded = () => {
    const next = vidIdx + 1
    if (next < projet.videos.length) switchVideo(next)
    else doStop()
  }

  if (!projet || !video) return null

  return (
    <div
      className={`modal-overlay video-modal-overlay${closing ? ' is-closing' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className={`modal-panel video-modal-panel${closing ? ' is-closing' : ''}`}>

        {/* ── En-tête ── */}
        <div className="modal-header">
          <span className="modal-title">All Videos</span>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* ── Corps ── */}
        <div className="video-modal-body">

          {/* Sidebar projets */}
          <nav className="video-modal-sidebar">
            {projets.map((p, i) => (
              <button
                key={i}
                className={`video-modal-proj-btn${i === projIdx ? ' active' : ''}`}
                onClick={() => switchProject(i)}
              >
                <ChevronRight size={13} className="vmp-chevron" />
                <span>{p.nom}</span>
              </button>
            ))}
          </nav>

          {/* Zone principale */}
          <div className="video-modal-main">

            {/* Lecteur */}
            <div className="video-modal-player-wrap">
              <video
                key={video.fichier}
                ref={videoRef}
                className="video-modal-player"
                poster={mediaUrl('video', encodeVideoPath(video.poster))}
                onEnded={handleEnded}
                onCanPlay={handleCanPlay}
                playsInline
                muted
              >
                <source src={mediaUrl('video', encodeVideoPath(video.fichier))} type="video/mp4" />
              </video>

              {!playing && (
                <button className="play-btn play-btn--sm" onClick={doPlay} aria-label="Play">
                  <Play size={20} fill="currentColor" />
                </button>
              )}
              {playing && (
                <button className="video-stop-btn" onClick={doStop} aria-label="Stop">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Miniatures multi-clips */}
            {projet.videos.length > 1 && (
              <div className="video-modal-clips">
                {projet.videos.map((v, i) => (
                  <button
                    key={i}
                    className={`video-modal-clip-thumb${i === vidIdx ? ' active' : ''}`}
                    onClick={() => switchVideo(i)}
                    style={{ backgroundImage: `url(${mediaUrl('video', encodeVideoPath(v.poster))})` }}
                    aria-label={`Clip ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Description */}
            <p className="video-modal-desc">{projet.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
