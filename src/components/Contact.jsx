import { useState } from 'react'
import { MapPin, ArrowRight, CheckCircle, AlertCircle, User } from 'lucide-react'
import { useContent, mediaUrl } from '../content.jsx'

const FORMSPREE_ID = 'xojbkjna'

export default function Contact() {
  const c = useContent('contact')
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [errors, setErrors] = useState({})

  const clearError = (field) => {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const data = new FormData(e.target)

    // Validation des champs obligatoires
    const newErrors = {}
    if (!data.get('name')?.trim())    newErrors.name    = true
    if (!data.get('email')?.trim())   newErrors.email   = true
    if (!data.get('message')?.trim()) newErrors.message = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setStatus('sending')
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
            {/* Honeypot anti-spam */}
            <input
              type="text"
              name="_gotcha"
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <input
              type="text"
              name="name"
              placeholder={c.formulaire.nom}
              className={errors.name ? 'field-error' : ''}
              onChange={() => clearError('name')}
            />
            <input
              type="text"
              name="company"
              placeholder={c.formulaire.societe}
            />
            <input
              type="email"
              name="email"
              placeholder={c.formulaire.email}
              className={errors.email ? 'field-error' : ''}
              onChange={() => clearError('email')}
            />
            <input
              type="tel"
              name="phone"
              placeholder={c.formulaire.telephone}
            />
            <textarea
              name="message"
              className={`full${errors.message ? ' field-error' : ''}`}
              placeholder={c.formulaire.message}
              onChange={() => clearError('message')}
            />

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
