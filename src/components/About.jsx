import { useEffect, useRef } from 'react'
import { useContent, mediaUrl } from '../content.jsx'
import SectionTitle from './SectionTitle.jsx'

export default function About() {
  const c = useContent('about')
  const { nombreFrames, dossierFrames } = c.video
  const imageRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const el = imageRef.current
    const canvas = canvasRef.current
    if (!el || !canvas) return
    const ctx = canvas.getContext('2d')

    const frames = []

    const drawFrame = (img) => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cw = Math.round(w * dpr)
      const ch = Math.round(h * dpr)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
      }
      if (!img || !img.complete || !img.naturalWidth) return
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
      const dw = img.naturalWidth * scale
      const dh = img.naturalHeight * scale
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
    }

    const render = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const h = rect.height
      const scrollY = window.scrollY

      // Progress ancré au scroll : p=0 garanti en haut de page (frame 1),
      // même si la section est déjà partiellement visible au chargement.
      const sectionDocTop = rect.top + scrollY
      const scrollStart = Math.max(0, sectionDocTop - vh)
      const p = Math.max(0, Math.min(1, (scrollY - scrollStart) / h))

      const w = el.offsetWidth
      const rx = (w - 90) * p
      const tx = w * p
      el.style.clipPath = `polygon(0 0, ${rx}px 0, ${tx}px 50%, ${rx}px 100%, 0 100%)`

      const idx = Math.min(nombreFrames - 1, Math.round(p * (nombreFrames - 1)))
      drawFrame(frames[idx])
    }

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        render()
        ticking = false
      })
    }

    for (let i = 1; i <= nombreFrames; i++) {
      const img = new Image()
      img.src = mediaUrl('about', `${dossierFrames}/frame-${String(i).padStart(3, '0')}.jpg`)
      img.onload = render
      frames.push(img)
    }

    render()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [nombreFrames, dossierFrames])

  return (
    <section className="about" id="apropos">
      <div className="about-grid">
        <div ref={imageRef} className="about-image">
          <canvas ref={canvasRef} className="about-canvas" />
        </div>

        <div className="about-text">
          <div className="container" style={{ padding: 0 }}>
            <p className="eyebrow">{c.eyebrow}</p>
            <SectionTitle titre={c.titre} />
            <p>{c.paragraphe}</p>
            <blockquote className="about-blockquote">{c.citation}</blockquote>

            <div className="certifs">
              {c.certifications.map((cert) => (
                <div className="certif" key={cert.label}>
                  <span className="certif-check">✓</span>
                  <span className="certif-label">{cert.label}</span>
                  <span className="certif-detail">{cert.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
