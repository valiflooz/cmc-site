import { useContent } from '../content.jsx'

export default function Footer() {
  const c = useContent('footer')

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p className="footer-copy">{c.copyright}</p>
      </div>
    </footer>
  )
}
