// Titre de section au format { ligne1, ligne2, accent }
// Le <br /> n'est inséré que si ligne1 est non-vide, permettant un titre mono-ligne.
export default function SectionTitle({ titre }) {
  return (
    <h2 className="section-title">
      {titre.ligne1}{titre.ligne1 ? <br /> : null}
      {titre.ligne2}<span className="accent">{titre.accent}</span>
    </h2>
  )
}
