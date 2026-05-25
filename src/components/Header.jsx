import { useEffect, useState, useRef } from 'react'
import { ChevronDown, Menu } from 'lucide-react'
import { useContent, useLang, mediaUrl } from '../content.jsx'

const LANG_LABELS = { en: 'EN', zh: '中文', tr: 'TR' }

export default function Header() {
  const c = useContent('header')
  const { lang, setLang } = useLang()
  const [scrolled,  setScrolled]  = useState(false)
  const [langOpen,  setLangOpen]  = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)   // -1 = hero, pas de lien actif
  const [hoverIdx,  setHoverIdx]  = useState(null)

  // Indicator state
  const [ind,        setInd]        = useState({ left: 0, width: 0 })
  const [indVisible, setIndVisible] = useState(false)
  const indicatorRef  = useRef(null)
  const wasVisibleRef = useRef(false)  // était déjà visible → slide ; sinon → étirement

  const langRef  = useRef(null)
  const linkRefs = useRef([])
  const liensRef = useRef(c.liens)

  useEffect(() => { liensRef.current = c.liens }, [c.liens])

  // Header shadow
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    fn()
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Close lang dropdown
  useEffect(() => {
    const fn = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Scroll spy
  useEffect(() => {
    const fn = () => {
      const threshold = window.innerHeight * 0.4
      const scrollY   = window.scrollY + threshold
      let active = -1
      liensRef.current.forEach((l, i) => {
        const el = document.querySelector(l.ancre)
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY
          if (top <= scrollY) active = i
        }
      })
      setActiveIdx(active)
    }
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Indicateur glissant ───────────────────────────────────────────────────
  const targetIdx = hoverIdx !== null ? hoverIdx : activeIdx

  useEffect(() => {
    // Cas 1 : plus de lien actif → rétrécir vers le centre
    if (targetIdx === -1) {
      wasVisibleRef.current = false
      setIndVisible(false)
      return
    }

    const update = () => {
      const link = linkRefs.current[targetIdx]
      if (!link) return
      const left  = link.offsetLeft
      const width = link.offsetWidth

      if (!wasVisibleRef.current) {
        // Cas 2 : apparition — placer sans transition, puis étirer depuis le centre
        wasVisibleRef.current = true
        const el = indicatorRef.current
        if (el) el.style.transition = 'none'  // désactive temporairement les transitions
        setInd({ left, width })
        // Double rAF : garantit que le navigateur a peint la nouvelle position avant de lancer le scale
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (indicatorRef.current) indicatorRef.current.style.transition = ''
          setIndVisible(true)
        }))
      } else {
        // Cas 3 : déjà visible → glisser vers le nouveau lien
        setInd({ left, width })
        setIndVisible(true)
      }
    }

    const t = setTimeout(update, 10)
    window.addEventListener('resize', update)
    return () => { clearTimeout(t); window.removeEventListener('resize', update) }
  }, [targetIdx, lang])

  const switchLang = (l) => { setLang(l); setLangOpen(false) }

  return (
    <header className={`header${scrolled ? ' scrolled' : ''}`}>
      <div className="container header-inner">

        <a href="#top" className="logo-box header-logo" aria-label="CMC SUBSEATEC">
          <img src={mediaUrl('header', c.logo)} alt="CMC SUBSEATEC" />
        </a>

        <nav className="nav" onMouseLeave={() => setHoverIdx(null)}>
          {c.liens.map((l, i) => (
            <a
              key={l.ancre}
              href={l.ancre}
              ref={el => { linkRefs.current[i] = el }}
              onMouseEnter={() => setHoverIdx(i)}
            >
              {l.label}
            </a>
          ))}

          {/* Indicateur unique — toujours dans le DOM, visible via scaleX */}
          <span
            ref={indicatorRef}
            className={`nav-indicator${indVisible ? ' is-visible' : ''}`}
            style={{ left: ind.left, width: ind.width }}
          />
        </nav>

        <div className="header-right">
          <a href={c.boutonContact.ancre} className="btn btn-outline">
            {c.boutonContact.label}
          </a>

          <div className="lang" ref={langRef} onClick={() => setLangOpen(!langOpen)}>
            <span>{LANG_LABELS[lang]}</span>
            <ChevronDown size={14} className={langOpen ? 'lang-chevron open' : 'lang-chevron'} />
            {langOpen && (
              <div className="lang-dropdown">
                {Object.entries(LANG_LABELS).map(([code, label]) => (
                  <button
                    key={code}
                    className={`lang-option${lang === code ? ' active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); switchLang(code) }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="burger" aria-label="Menu">
            <Menu size={24} />
          </button>
        </div>

      </div>
    </header>
  )
}
