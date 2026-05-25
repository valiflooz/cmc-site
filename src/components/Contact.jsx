import { useState } from 'react'
import { MapPin, ArrowRight, CheckCircle, AlertCircle, User } from 'lucide-react'
import { useContent, mediaUrl } from '../content.jsx'

/* ─── Remplace par ton ID Formspree ──────────────────────────────────────────
   1. Va sur https://formspree.io et crée un compte avec eric.guillermet@subseatec.com
   2. Crée un nouveau formulaire (« New Form »)
   3. Copie l'ID (ex : xabc1234) et remplace VOTRE_ID_FORMSPREE ci-dessous       */
const FORMSPREE_ID = 'VOTRE_ID_FORMSPREE'

export default function Contact() {
  const c = useContent('contact')
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    const data = new FormData(e.target)
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        setStatus('success')
        e.target.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="contact" id="contact">
      <div className="container">
        <p className="eyebrow">{c.eyebrow}</p>
        <div className="contact-grid">
          <div className="contact-info">
            <h2 className="section-title">{c.titre.avant}<span className="accent">{c.titre.accent}</span></h2>
            <p>{c.paragraphe}</p>

            <div className="contact-line">
              <span className="ci"><MapPin size={16} /></span>
              {c.adresse}
            </div>

            <div className="contact-ceo">
              {c.ceo?.photo
                ? <img src={mediaUrl('contact', c.ceo.photo)} alt={c.ceo.nom} className="ceo-photo" />
                : <div className="ceo-photo ceo-photo--placeholder"><User size={40} /></div>
              }
              <div className="ceo-meta">
                <span className="ceo-nom">{c.ceo?.nom ?? 'CEO Name'}</span>
                <span className="ceo-titre">{c.ceo?.fonction ?? 'Chief Executive Officer'}</span>
              </div>
            </div>
          </div>

          <form className="contact-form" onSubmit={onSubmit} noValidate>
            {/* Honeypot anti-spam — invisible pour les humains, rempli par les bots */}
            <input
              type="text"
              name="_gotcha"
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <input type="text"  name="name"    placeholder={c.formulaire.nom}      required />
            <input type="text"  name="company" placeholder={c.formulaire.societe} />
            <input type="email" name="email"   placeholder={c.formulaire.email}   required />
            <input type="tel"   name="phone"   placeholder={c.formulaire.telephone} />
            <textarea name="message" className="full" placeholder={c.formulaire.message} required />

            {status === 'success' && (
              <div className="form-feedback form-feedback--ok">
                <CheckCircle size={16} />
                Message sent — we'll get back to you shortly.
              </div>
            )}
            {status === 'error' && (
              <div className="form-feedback form-feedback--err">
                <AlertCircle size={16} />
                Something went wrong. Please try again or email us directly.
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === 'sending' || status === 'success'}
            >
              {status === 'sending' ? 'Sending…' : c.boutonFormulaire}
              {status !== 'sending' && <span className="btn-arrow"><ArrowRight size={16} /></span>}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
