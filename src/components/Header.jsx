import { useEffect, useState, useRef } from 'react'
import { ChevronDown, Menu } from 'lucide-react'
import { useContent, useLang, mediaUrl } from '../content.jsx'

const LANG_LABELS = { en: 'EN', zh: '中文', tr: 'TR' }

export default function Header() {
  const c = useContent('header')
  const { lang, setLang } = useLang()
  const [scrolled, setScrolled]   = useState(false)
  const [langOpen, setLangOpen]   = useState(false)
  const langRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Close dropdown on outside click */
  useEffect(() => {
    const onClick = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const switchLang = (l) => { setLang(l); setLangOpen(false) }

  return (
    <header className={`header${scrolled ? ' scrolled' : ''}`}>
      <div className="container header-inner">
        <a href="#top" className="logo-box header-logo" aria-label="CMC SUBSEATEC">
          <img src={mediaUrl('header', c.logo)} alt="CMC SUBSEATEC" />
        </a>

        <nav className="nav">
          {c.liens.map((l, i) => (
            <a key={l.ancre} href={l.ancre} className={i === 0 ? 'active' : ''}>
              {l.label}
            </a>
          ))}
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
