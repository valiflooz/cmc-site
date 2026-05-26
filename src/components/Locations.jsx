import { useContent } from '../content.jsx'
import SectionTitle from './SectionTitle.jsx'
import WorldMap from './WorldMap.jsx'

const encodeLogoPath = (file) =>
  file.split('/').map(encodeURIComponent).join('/')

export default function Locations() {
  const c = useContent('locations')
  const logos = c.partenaires?.logos ?? []

  return (
    <section className="locations" id="locations">
      <div className="container">

        <div className="locations-grid">
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
          </div>

          <WorldMap marqueurs={c.marqueurs} />
        </div>

        {logos.length > 0 && (
          <div className="partners-strip">
            <p className="partners-label">{c.partenaires.label}</p>
            <div className="partners-logos">
              {logos.map((fichier, i) => (
                <img
                  key={i}
                  src={`/content/locations/${encodeLogoPath(fichier)}`}
                  alt={`Partner ${i + 1}`}
                  className="partner-logo"
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
