import { useEffect, useState } from 'react'
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react'

const SPEEDS = [1, 2, 4]

function fmt(sec) {
  if (!sec || isNaN(sec)) return '00:00'
  const s = Math.floor(sec)
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Barre de contrôle vidéo réutilisable.
 * Props :
 *   videoRef          — ref sur l'élément <video>
 *   videoKey          — clé qui change quand la vidéo change (remet à zéro)
 *   visible           — booléen géré par le parent (souris inactive → false)
 *   isMuted           — état muet
 *   onToggleMute      — callback
 *   isFullscreen      — état plein écran (undefined = pas de bouton plein écran)
 *   onToggleFullscreen — callback (undefined = bouton masqué)
 */
export default function VideoControlBar({
  videoRef,
  videoKey,
  visible,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
}) {
  const [current,  setCurrent]  = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed,    setSpeed]    = useState(1)

  // Ré-attacher les écouteurs à chaque changement de vidéo
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const onTime = () => setCurrent(vid.currentTime)
    const onMeta = () => setDuration(vid.duration || 0)
    vid.addEventListener('timeupdate',      onTime)
    vid.addEventListener('loadedmetadata',  onMeta)
    vid.addEventListener('durationchange',  onMeta)
    // Valeurs initiales si la vidéo est déjà prête
    if (vid.readyState >= 1) onMeta()
    return () => {
      vid.removeEventListener('timeupdate',      onTime)
      vid.removeEventListener('loadedmetadata',  onMeta)
      vid.removeEventListener('durationchange',  onMeta)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoKey])

  // Remettre à zéro vitesse et temps quand la vidéo change
  useEffect(() => {
    setSpeed(1)
    setCurrent(0)
    setDuration(0)
    if (videoRef.current) videoRef.current.playbackRate = 1
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoKey])

  const seek = (e) => {
    const vid = videoRef.current
    if (!vid || !duration) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    vid.currentTime = ratio * duration
  }

  const changeSpeed = (s) => {
    setSpeed(s)
    if (videoRef.current) videoRef.current.playbackRate = s
  }

  const progress = duration ? current / duration : 0

  return (
    <div className={`video-bar${visible ? ' is-visible' : ''}`}>

      {/* ── Barre de progression ── */}
      <div className="video-bar-progress" onClick={seek}>
        <div className="video-bar-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* ── Ligne de contrôles ── */}
      <div className="video-bar-row">

        {/* Timer */}
        <span className="video-bar-time">{fmt(current)} / {fmt(duration)}</span>

        <div className="video-bar-right">

          {/* Vitesse */}
          <div className="video-bar-speeds">
            {SPEEDS.map(s => (
              <button
                key={s}
                className={`video-bar-speed${speed === s ? ' active' : ''}`}
                onClick={() => changeSpeed(s)}
                aria-label={`Vitesse ${s}x`}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Muet */}
          {onToggleMute && (
            <button
              className="video-ctrl-btn"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          )}

          {/* Plein écran (optionnel) */}
          {onToggleFullscreen && (
            <button
              className="video-ctrl-btn"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
