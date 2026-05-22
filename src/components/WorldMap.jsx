import { useRef, useEffect, useCallback } from 'react'
import * as d3 from 'd3-geo'
import * as topojson from 'topojson-client'
import { useContent } from '../content.jsx'
import { splitNom } from './ProjectModal.jsx'

/* ── Constants ───────────────────────────────────────────────────── */
const DOT_RADIUS     = 1.6
const DOT_SPACING    = 5
const CITY_RADIUS    = 5
const REPEL_RADIUS   = 80
const REPEL_STRENGTH = 5
const ZOOM_RADIUS    = 40
const WAVE_SPREAD    = 2800
const DOT_POP_DUR    = 500

/* ── Country lat/lng for dynamic project markers ─────────────────── */
const COUNTRY_LATLNG = {
  'Norway':   { lat:  62, lng:  10, ox:  12, oy: -18 },
  'France':   { lat:  46, lng:   2, ox: -12, oy: -18 },
  'Türkiye':  { lat:  39, lng:  35, ox:  12, oy: -18 },
  'Turkey':   { lat:  39, lng:  35, ox:  12, oy: -18 },
  'UAE':      { lat:  24, lng:  54, ox:  12, oy: -18 },
  'Brazil':   { lat: -10, lng: -53, ox:  12, oy: -18 },
  'USA':      { lat:  38, lng: -97, ox:   0, oy: -18 },
  'UK':       { lat:  54, lng:  -3, ox: -12, oy: -18 },
  'Australia':{ lat: -25, lng: 133, ox:  12, oy: -18 },
  'Japan':    { lat:  36, lng: 138, ox:  12, oy: -18 },
}

/* ── Easing ──────────────────────────────────────────────────────── */
function backOut(t) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const c1 = 5.0, c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/* ── Component ───────────────────────────────────────────────────── */
export default function WorldMap({ marqueurs = [] }) {
  const projectsData  = useContent('projects')
  const canvasRef     = useRef(null)
  const wrapperRef    = useRef(null)
  const dotsRef       = useRef([])
  const citiesRef     = useRef([])
  const mouseRef      = useRef({ x: -9999, y: -9999 })
  const hoveredRef    = useRef(null)
  const rafRef        = useRef(0)
  const pulseRef      = useRef(0)
  const revealRef     = useRef(null)
  const allRevRef     = useRef(false)
  const boxesRef      = useRef([])

  /* Build city list: office markers + dynamic project markers */
  const buildCities = useCallback((projection) => {
    const officeCities = marqueurs.map(m => {
      const [cx, cy] = projection([m.lng, m.lat])
      return { name: m.label || 'CMC Office', x: cx, y: cy, ox: m.ox ?? 12, oy: m.oy ?? -18,
               pulse: Math.random(), labelZoom: 1, scale: 0, revealDelay: 0, isOffice: true }
    })

    const seen = new Set()
    const projectCities = (projectsData?.projets || []).reduce((acc, p) => {
      const { lieu, titre } = splitNom(p.nom)
      if (!lieu || !COUNTRY_LATLNG[lieu] || seen.has(lieu)) return acc
      seen.add(lieu)
      const coords = COUNTRY_LATLNG[lieu]
      const [cx, cy] = projection([coords.lng, coords.lat])
      acc.push({ name: lieu, x: cx, y: cy, ox: coords.ox, oy: coords.oy,
                 pulse: Math.random(), labelZoom: 1, scale: 0, revealDelay: 0,
                 isOffice: false, project: titre })
      return acc
    }, [])

    return [...officeCities, ...projectCities]
  }, [marqueurs, projectsData])

  const topoCache = useRef(null)

  const buildMap = useCallback(async (W, H) => {
    /* Fetch world topojson once, then cache */
    if (!topoCache.current)
      topoCache.current = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json())
    const topo = topoCache.current

    /* Filter out Antarctica (country id = 10) from individual countries */
    const countriesGeo = topojson.feature(topo, topo.objects.countries)
    const noAntarctica = {
      type: 'FeatureCollection',
      features: countriesGeo.features.filter(f => +f.id !== 10)
    }

    /* fitSize on actual non-Antarctic land → fills canvas edge-to-edge
       with real land, zero empty ocean padding at top or bottom        */
    const projection = d3.geoNaturalEarth1().fitSize([W, H], noAntarctica)
    const path = d3.geoPath(projection)

    /* Off-screen canvas for land pixel detection (no Antarctica) */
    const off = document.createElement('canvas')
    off.width = W; off.height = H
    const offCtx = off.getContext('2d')
    offCtx.beginPath()
    path.context(offCtx)(noAntarctica)
    offCtx.fillStyle = '#000'
    offCtx.fill()
    const img = offCtx.getImageData(0, 0, W, H)
    const isLand = (px, py) => {
      const ix = Math.round(px), iy = Math.round(py)
      if (ix < 0 || iy < 0 || ix >= W || iy >= H) return false
      return img.data[(iy * W + ix) * 4 + 3] > 128
    }

    /* Generate dots */
    const dots = []
    for (let y = 0; y < H; y += DOT_SPACING)
      for (let x = 0; x < W; x += DOT_SPACING)
        if (isLand(x, y)) dots.push({ x, y, ox: x, oy: y, scale: 0, revealDelay: 0 })

    const minX = Math.min(...dots.map(d => d.ox))
    const maxX = Math.max(...dots.map(d => d.ox))
    for (const dot of dots) {
      const t = (dot.ox - minX) / (maxX - minX)
      const jitter = ((dot.oy / H) - 0.5) * 60
      dot.revealDelay = t * WAVE_SPREAD + jitter
    }
    dotsRef.current = dots

    /* Build city markers */
    const cities = buildCities(projection)
    const span = maxX - minX
    for (const c of cities) {
      const t = (c.x - minX) / span
      c.revealDelay = t * WAVE_SPREAD
    }
    citiesRef.current = cities
  }, [buildCities])

  /* ── Draw loop (batched — single path per colour) ──────────────── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    pulseRef.current += 0.012
    const mouse = mouseRef.current
    const elapsed = revealRef.current !== null ? Date.now() - revealRef.current : 0
    const REPEL_SQ = REPEL_RADIUS * REPEL_RADIUS

    /* 1 — Update dot positions & separate normal / repelled */
    const repelled = []
    for (const dot of dotsRef.current) {
      if (!allRevRef.current)
        dot.scale = backOut(Math.min(1, Math.max(0, (elapsed - dot.revealDelay) / DOT_POP_DUR)))
      if (dot.scale <= 0) continue
      const dx = dot.ox - mouse.x, dy = dot.oy - mouse.y
      const distSq = dx * dx + dy * dy
      if (distSq < REPEL_SQ) {
        const dist = Math.sqrt(distSq)
        const prox = Math.pow(1 - dist / REPEL_RADIUS, 3)
        const force = prox * REPEL_STRENGTH
        const angle = Math.atan2(dy, dx)
        dot.x += (dot.ox + Math.cos(angle) * force - dot.x) * 0.18
        dot.y += (dot.oy + Math.sin(angle) * force - dot.y) * 0.18
        repelled.push(dot)
      } else {
        dot.x += (dot.ox - dot.x) * 0.12
        dot.y += (dot.oy - dot.y) * 0.12
      }
    }

    /* 2 — Draw all normal dots in ONE path (huge perf gain) */
    const repelledSet = new Set(repelled)
    ctx.beginPath()
    for (const dot of dotsRef.current) {
      if (dot.scale <= 0 || repelledSet.has(dot)) continue
      const r = DOT_RADIUS * dot.scale
      ctx.moveTo(dot.x + r, dot.y)
      ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2)
    }
    ctx.fillStyle = '#7a8694'
    ctx.fill()

    /* 3 — Draw repelled dots in ONE path (lighter) */
    if (repelled.length) {
      ctx.beginPath()
      for (const dot of repelled) {
        const r = DOT_RADIUS * dot.scale * 1.25
        ctx.moveTo(dot.x + r, dot.y)
        ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2)
      }
      ctx.fillStyle = '#b8c8d8'
      ctx.fill()
    }

    if (!allRevRef.current && elapsed > WAVE_SPREAD + DOT_POP_DUR + 100) {
      allRevRef.current = true
      dotsRef.current.forEach(d => d.scale = 1)
      citiesRef.current.forEach(c => c.scale = 1)
    }

    /* City markers */
    const scale = Math.max(0.7, W / 1200)
    boxesRef.current = []

    for (const city of citiesRef.current) {
      if (!allRevRef.current)
        city.scale = backOut(Math.min(1, Math.max(0, (elapsed - city.revealDelay) / DOT_POP_DUR)))
      if (city.scale <= 0) continue

      const isHov = hoveredRef.current === city.name
      const dxM = city.x - mouse.x, dyM = city.y - mouse.y
      const distM = Math.sqrt(dxM * dxM + dyM * dyM)
      const zoomS = isHov ? 1 + 0.5 * Math.max(0, 1 - distM / ZOOM_RADIUS) : 1

      ctx.save()
      ctx.translate(city.x, city.y); ctx.scale(city.scale, city.scale); ctx.translate(-city.x, -city.y)

      const pulse = Math.sin(pulseRef.current + city.pulse * Math.PI * 2)
      const ps = CITY_RADIUS + pulse * 2.5
      const pa = 0.12 + pulse * 0.08
      const orange = city.isOffice ? '#e98b2e' : '#e0e8f0'
      const orangeRgb = city.isOffice ? '233,139,46' : '180,210,240'

      const g = ctx.createRadialGradient(city.x, city.y, 0, city.x, city.y, ps * 3 * zoomS)
      g.addColorStop(0, `rgba(${orangeRgb},${pa})`); g.addColorStop(1, `rgba(${orangeRgb},0)`)
      ctx.beginPath(); ctx.arc(city.x, city.y, ps * 3 * zoomS, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
      ctx.beginPath(); ctx.arc(city.x, city.y, ps * 1.6 * zoomS, 0, Math.PI * 2); ctx.fillStyle = `rgba(${orangeRgb},0.25)`; ctx.fill()
      ctx.beginPath(); ctx.arc(city.x, city.y, CITY_RADIUS * zoomS, 0, Math.PI * 2); ctx.fillStyle = orange; ctx.fill()
      ctx.beginPath(); ctx.arc(city.x - CITY_RADIUS * 0.25 * zoomS, city.y - CITY_RADIUS * 0.25 * zoomS, CITY_RADIUS * 0.35 * zoomS, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill()
      ctx.restore()

      /* Label */
      ctx.globalAlpha = Math.min(1, city.scale)
      const targetZ = isHov ? 1.22 : 1
      city.labelZoom += (targetZ - city.labelZoom) * 0.1
      const lx = city.x + city.ox * scale
      const ly = city.y + city.oy * scale
      const fontSize = 11 * scale * city.labelZoom
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`
      const text = city.name.toUpperCase()
      const tw = ctx.measureText(text).width
      const padX = 8 * scale * city.labelZoom, padY = 5 * scale * city.labelZoom
      const bw = tw + padX * 2, bh = fontSize + padY * 2
      const bx = lx - bw / 2, by = ly - bh / 2

      /* Connector line */
      const dx2 = lx - city.x, dy2 = ly - city.y
      const ang2 = Math.atan2(dy2, dx2)
      ctx.beginPath()
      ctx.moveTo(city.x + Math.cos(ang2) * CITY_RADIUS * zoomS, city.y + Math.sin(ang2) * CITY_RADIUS * zoomS)
      ctx.lineTo(lx, ly)
      ctx.strokeStyle = isHov ? `rgba(${orangeRgb},0.8)` : 'rgba(255,255,255,0.2)'
      ctx.lineWidth = isHov ? 1.5 : 0.8; ctx.stroke()

      /* Label box */
      if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 3)
        ctx.fillStyle = isHov ? `rgba(${orangeRgb},0.15)` : 'rgba(10,18,28,0.85)'; ctx.fill()
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 3)
        ctx.strokeStyle = isHov ? orange : 'rgba(255,255,255,0.18)'
        ctx.lineWidth = isHov ? 1.2 : 0.7; ctx.stroke()
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillStyle = isHov ? orange : 'rgba(255,255,255,0.88)'
      ctx.fillText(text, lx, ly)
      ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1

      if (city.scale > 0.95) boxesRef.current.push({ name: city.name, x: bx, y: by, w: bw, h: bh })
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [])

  /* ── Build once — height = left text column height ─────────────── */
  useEffect(() => {
    const wrapper = wrapperRef.current, canvas = canvasRef.current
    if (!wrapper || !canvas) return
    const tid = setTimeout(() => {
      const W = wrapper.clientWidth
      // Read the sibling text column to get the exact same height
      const textCol = wrapper.closest('.locations-grid')?.querySelector('.locations-text')
      const H = textCol ? textCol.clientHeight : Math.round(W * 0.52)
      if (W < 10 || H < 10) return
      canvas.width = W
      canvas.height = H
      canvas.style.height = H + 'px'
      buildMap(W, H).then(() => {
        rafRef.current = requestAnimationFrame(draw)
      })
    }, 100)
    return () => { clearTimeout(tid); cancelAnimationFrame(rafRef.current) }
  }, [buildMap, draw])

  /* ── IntersectionObserver for wave reveal ─────────────────────── */
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && revealRef.current === null) {
        revealRef.current = Date.now()
        allRevRef.current = false
      }
    }, { threshold: 0.2 })
    obs.observe(wrapper)
    return () => obs.disconnect()
  }, [])

  /* ── Mouse interaction ─────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const sx = canvas.width / rect.width, sy = canvas.height / rect.height
      const mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sy
      mouseRef.current = { x: mx, y: my }
      let found = null
      for (const c of citiesRef.current) {
        const d = Math.sqrt((c.x - mx) ** 2 + (c.y - my) ** 2)
        if (d < ZOOM_RADIUS) { found = c.name; break }
      }
      if (!found) {
        for (const b of boxesRef.current) {
          if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) { found = b.name; break }
        }
      }
      hoveredRef.current = found
    }
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; hoveredRef.current = null }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)
    return () => { canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('mouseleave', onLeave) }
  }, [])

  return (
    <div className="map-wrap" ref={wrapperRef}>
      <canvas ref={canvasRef} style={{ width: '100%', display: 'block', borderRadius: '8px' }} />
      <div className="map-legend">
        <span className="legend-item"><span className="legend-dot legend-dot--office" />CMC Offices</span>
        <span className="legend-item"><span className="legend-dot legend-dot--project" />Projects</span>
      </div>
    </div>
  )
}
