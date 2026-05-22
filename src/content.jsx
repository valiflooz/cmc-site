import { createContext, useContext, useState, useEffect } from 'react'

const SECTIONS = ['header', 'hero', 'about', 'projects', 'video', 'locations', 'contact', 'footer']

const ContentContext = createContext(null)

/* ── Deep merge ──────────────────────────────────────────────────────────────
   Arrays are merged element-by-element so a translation can override only
   'description' inside a project entry without losing 'cover' / 'phases'.    */
function deepMerge(base, override) {
  if (!override || typeof override !== 'object') return override ?? base
  if (Array.isArray(override)) {
    if (Array.isArray(base)) {
      return base.map((item, i) =>
        i < override.length ? deepMerge(item, override[i]) : item
      )
    }
    return override
  }
  const result = { ...base }
  for (const key of Object.keys(override)) {
    if (key === 'i18n') continue   // never expose the raw translation block
    result[key] = deepMerge(base?.[key], override[key])
  }
  return result
}

/* ── Provider ────────────────────────────────────────────────────────────── */
export function ContentProvider({ children }) {
  const [rawContent, setRawContent] = useState(null)
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('cmc-lang') || 'en' } catch { return 'en' }
  })

  const setLang = (l) => {
    setLangState(l)
    try { localStorage.setItem('cmc-lang', l) } catch {}
  }

  useEffect(() => {
    Promise.all(
      SECTIONS.map((section) =>
        fetch(`/content/${section}/content.json`)
          .then((res) => res.json())
          .then((data) => [section, data])
      )
    ).then((entries) => setRawContent(Object.fromEntries(entries)))
  }, [])

  if (!rawContent) return null
  return (
    <ContentContext.Provider value={{ rawContent, lang, setLang }}>
      {children}
    </ContentContext.Provider>
  )
}

/* ── Hooks ───────────────────────────────────────────────────────────────── */
export function useContent(section) {
  const { rawContent, lang } = useContext(ContentContext)
  const base = rawContent[section]
  if (lang === 'en' || !base?.i18n?.[lang]) return base
  return deepMerge(base, base.i18n[lang])
}

export function useLang() {
  const { lang, setLang } = useContext(ContentContext)
  return { lang, setLang }
}

// Construit l'URL d'un média rangé dans public/content/<section>/
export function mediaUrl(section, file) {
  return `/content/${section}/${file}`
}
