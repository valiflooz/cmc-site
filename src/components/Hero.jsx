import { ArrowRight } from 'lucide-react'
import { useContent, mediaUrl } from '../content.jsx'

const WORD_STEP = 0.12

export default function Hero() {
  const c = useContent('hero')
  let wi = 0

  // Derive WebP path from JPEG filename (background.jpg → background.webp)
  const jpegUrl = mediaUrl('hero', c.fond)
  const webpUrl = jpegUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp')

  return (
    <section className="hero" id="top">

      {/* ── Background image — <picture> pour WebP + fetchpriority high ── */}
      <picture className="hero-bg" aria-hidden="true">
        <source srcSet={webpUrl} type="image/webp" />
        <img
          src={jpegUrl}
          alt=""
          fetchpriority="high"
          decoding="async"
          className="hero-bg-img"
        />
      </picture>
      {/* Gradient overlay */}
      <div className="hero-bg-gradient" aria-hidden="true" />
      <div className="hero-content">
        <h1>
          {c.titreLignes.map((ligne, li) => {
            const spans = ligne.texte.split(' ').map((mot, mi) => (
              <span
                key={mi}
                className="hero-word"
                style={{ animationDelay: `${(wi++) * WORD_STEP}s` }}
              >
                {mot}
              </span>
            ))
            const inner = spans.flatMap((s, i) => (i === 0 ? [s] : [' ', s]))
            return (
              <span key={li}>
                {ligne.accent ? <span className="accent">{inner}</span> : inner}
                {li < c.titreLignes.length - 1 && <br />}
              </span>
            )
          })}
        </h1>
        <p style={{ animationDelay: `${wi * WORD_STEP + 0.12}s` }}>{c.sousTitre}</p>
        <a
          href={c.bouton.ancre}
          className="btn btn-outline"
          style={{ animationDelay: `${wi * WORD_STEP + 0.3}s` }}
        >
          {c.bouton.label}
          <span className="btn-arrow"><ArrowRight size={15} /></span>
        </a>
      </div>
    </section>
  )
}
