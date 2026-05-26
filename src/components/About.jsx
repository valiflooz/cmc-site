import { useEffect, useRef } from 'react'
import { useContent, mediaUrl } from '../content.jsx'
import SectionTitle from './SectionTitle.jsx'

export default function About() {
  const c = useContent('about')
  const { nombreFrames, dossierFrames } = c.video
  const sectionRef = useRef(null)
  const imageRef  = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const el      = imageRef.current
    const canvas  = canvasRef.current
    if (!section || !el || !canvas) return

    const ctx    = canvas.getContext('2d')
    const frames = []
    const state  = { idx: 0, autoPlaying: false, raf: null }

    // ── Draw one frame ────────────────────────────────────────
    const drawFrame = (img) => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cw = Math.round(w * dpr)
      const ch = Math.round(h * dpr)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width  = cw
        canvas.height = ch
      }
      if (!img || !img.complete || !img.naturalWidth) return
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
      const dw = img.naturalWidth  * scale
      const dh = img.naturalHeight * scale
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
    }

    // ── Clip-path helper ──────────────────────────────────────
    const applyClip = (p) => {
      const w  = el.offsetWidth
      const rx = (w - 90) * p
      const tx = w * p
      el.style.clipPath = `polygon(0 0, ${rx}px 0, ${tx}px 50%, ${rx}px 100%, 0 100%)`
    }

    // ── Cache section geometry (refreshed on resize) ──────────
    let secTop = 0
    let secH   = 0
    const measure = () => {
      const r = section.getBoundingClientRect()
      secTop = r.top + window.scrollY
      secH   = r.height
    }
    measure()

    // ── Auto-play after section ───────────────────────────────
    const autoPlayTick = () => {
      if (!state.autoPlaying) return
      if (state.idx >= nombreFrames - 1) {
        state.autoPlaying = false
        return
      }
      state.idx += 1
      drawFrame(frames[state.idx])
      state.raf = requestAnimationFrame(autoPlayTick)
    }

    const startAutoPlay = () => {
      if (state.autoPlaying || state.idx >= nombreFrames - 1) return
      state.autoPlaying = true
      state.raf = requestAnimationFrame(autoPlayTick)
    }

    const stopAutoPlay = () => {
      if (!state.autoPlaying) return
      state.autoPlaying = false
      if (state.raf) { cancelAnimationFrame(state.raf); state.raf = null }
    }

    // ── Main render (scroll-driven) ───────────────────────────
    const render = () => {
      const scrollY  = window.scrollY
      const vh       = window.innerHeight

      // Scroll progress: 0 = section enters viewport, 1 = scroll range exhausted
      const scrollStart = Math.max(0, secTop - vh)
      const raw = (scrollY - scrollStart) / secH
      const p   = Math.max(0, Math.min(1, raw))

      if (raw >= 1) {
        // ── Scrolled past the animation zone → auto-play ─────
        applyClip(1)                      // hold clip fully open
        startAutoPlay()                   // play remaining frames
        return
      }

      // ── Section in animation zone → scroll-driven ────────
      stopAutoPlay()
      applyClip(p)
      const idx = Math.min(nombreFrames - 1, Math.round(p * (nombreFrames - 1)))
      state.idx = idx
      drawFrame(frames[idx])
    }

    // ── Listeners ─────────────────────────────────────────────
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => { render(); ticking = false })
    }
    const onResize = () => { measure(); render() }

    // ── Preload frames ────────────────────────────────────────
    for (let i = 1; i <= nombreFrames; i++) {
      const img = new Image()
      img.src = mediaUrl('about', `${dossierFrames}/frame-${String(i).padStart(3, '0')}.jpg`)
      img.onload = render
      frames.push(img)
    }

    render()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      stopAutoPlay()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [nombreFrames, dossierFrames])

  return (
    <section ref={sectionRef} className="about" id="about">
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
