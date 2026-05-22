import { ContentProvider } from './content.jsx'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Projects from './components/Projects.jsx'
import Video from './components/Video.jsx'
import Locations from './components/Locations.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <ContentProvider>
      <Header />
      <main>
        <Hero />
        <About />
        <Projects />
        <Video />
        <Locations />
        <Contact />
      </main>
      <Footer />
    </ContentProvider>
  )
}
