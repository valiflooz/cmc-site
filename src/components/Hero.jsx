import { ArrowRight } from 'lucide-react'
import { useContent, mediaUrl } from '../content.jsx'

const WORD_STEP = 0.12
const HERO_GRADIENT =
  'linear-gradient(90deg, rgba(11,22,32,0.96) 0%, rgba(11,22,32,0.78) 38%, rgba(11,22,32,0.35) 72%, rgba(11,22,32,0.55) 100%)'

export default function Hero() {
  const c = useContent('hero')
  let wi = 0

  return (
    <section
      className="hero"
      id="top"
      style={{ backgroundImage: `${HERO_GRADIENT}, url(${mediaUrl('hero', c.fond)})` }}
    >
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
