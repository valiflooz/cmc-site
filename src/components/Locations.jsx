import { ArrowRight } from 'lucide-react'
import { useContent } from '../content.jsx'
import SectionTitle from './SectionTitle.jsx'
import WorldMap from './WorldMap.jsx'

export default function Locations() {
  const c = useContent('locations')

  return (
    <section className="locations" id="implantations">
      <div className="container locations-grid">
        <div className="locations-text">
          <p className="eyebrow">{c.eyebrow}</p>
          <SectionTitle titre={c.titre} />
          <p>{c.paragraphe}</p>

          <div className="stats">
            {c.stats.map((s) => (
              <div className="stat" key={s.label}>
                <div className="num">{s.nombre}</div>
                <div className="label">{s.label}</div>
              </div>
            ))}
          </div>

          <a href={c.bouton.ancre} className="btn btn-orange-outline">
            {c.bouton.label}
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </a>
        </div>

        <WorldMap marqueurs={c.marqueurs} />
      </div>
    </section>
  )
}
