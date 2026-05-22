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

    // ── Shared mutable state ──────────────────────────────────
    const state = { idx: 0, autoPlaying: false, raf: null }

    // ── Draw a single decoded image onto the canvas ───────────
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

    // ── Clip path helper ──────────────────────────────────────
    const applyClip = (p) => {
      const w = el.offsetWidth
      const rx = (w - 90) * p
      const tx = w * p
      el.style.clipPath = `polygon(0 0, ${rx}px 0, ${tx}px 50%, ${rx}px 100%, 0 100%)`
    }

    // ── Scroll-driven render ──────────────────────────────────
    const render = () => {
      if (state.autoPlaying) return   // hands off while auto-completing
      const rect = el.getBoundingClientRect()
      const scrollY = window.scrollY
      const sectionDocTop = rect.top + scrollY
      const scrollStart = Math.max(0, sectionDocTop - window.innerHeight)
      const p = Math.max(0, Math.min(1, (scrollY - scrollStart) / rect.height))

      applyClip(p)

      const idx = Math.min(nombreFrames - 1, Math.round(p * (nombreFrames - 1)))
      state.idx = idx
      drawFrame(frames[idx])
    }

    // ── Auto-play: continue frames after section exits view ───
    const autoPlayTick = () => {
      if (!state.autoPlaying) return
      if (state.idx >= nombreFrames - 1) {
        state.autoPlaying = false
        applyClip(1)                       // fully open clip
        drawFrame(frames[nombreFrames - 1])
        return
      }
      state.idx += 1
      drawFrame(frames[state.idx])
      state.raf = requestAnimationFrame(autoPlayTick)
    }

    const startAutoPlay = () => {
      if (state.autoPlaying || state.idx >= nombreFrames - 1) return
      state.autoPlaying = true
      applyClip(1)
      state.raf = requestAnimationFrame(autoPlayTick)
    }

    const stopAutoPlay = () => {
      state.autoPlaying = false
      if (state.raf) { cancelAnimationFrame(state.raf); state.raf = null }
    }

    // ── IntersectionObserver: start auto-play when out of view ─
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (!entry.isIntersecting) {
        const rect = el.getBoundingClientRect()
        if (rect.top < 0) {
          // Scrolled PAST the section → auto-play remaining frames
          startAutoPlay()
        }
        // If rect.top > 0 the section is below the viewport — don't auto-play yet
      } else {
        // Back in view — stop auto-play and let scroll drive again
        stopAutoPlay()
        render()
      }
    }, { threshold: 0 })

    observer.observe(el)

    // ── Scroll & resize listeners ─────────────────────────────
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        render()
        ticking = false
      })
    }

    // ── Preload frames ────────────────────────────────────────
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
      stopAutoPlay()
      observer.disconnect()
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
