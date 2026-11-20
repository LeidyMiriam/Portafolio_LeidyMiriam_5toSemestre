import * as THREE from 'three'

// ─── utilidades ──────────────────────────────────────────────────────────────
export function aleatorio(semilla = 1) {
  let a = semilla >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const cache = new Map()

function crearTextura(clave, w, h, dibujar, { repetir = null, color = true } = {}) {
  if (cache.has(clave)) return cache.get(clave)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  dibujar(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  if (color) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  if (repetir) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(repetir[0], repetir[1])
  }
  cache.set(clave, tex)
  return tex
}

function granulado(ctx, w, h, rnd, cantidad = 4000, alpha = 0.05) {
  for (let i = 0; i < cantidad; i++) {
    const v = rnd() > 0.5 ? 255 : 0
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * rnd()})`
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2)
  }
}

// ─── madera ──────────────────────────────────────────────────────────────────
export function texturaMadera({ base = '#3a2216', veta = '#1e0f08', semilla = 7, repetir = [1, 1], tablas = 0 } = {}) {
  return crearTextura(`madera-${base}-${semilla}-${tablas}-${repetir}`, 512, 512, (ctx, w, h) => {
    const rnd = aleatorio(semilla)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, w, h)
    // vetas sinuosas
    for (let i = 0; i < 140; i++) {
      const y0 = rnd() * h
      const amp = 2 + rnd() * 10
      const frec = 0.004 + rnd() * 0.012
      const fase = rnd() * 10
      ctx.strokeStyle = veta
      ctx.globalAlpha = 0.08 + rnd() * 0.22
      ctx.lineWidth = 0.5 + rnd() * 2.5
      ctx.beginPath()
      for (let x = 0; x <= w; x += 8) {
        const y = y0 + Math.sin(x * frec + fase) * amp + Math.sin(x * frec * 3.1) * amp * 0.3
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    // nudos
    for (let i = 0; i < 3; i++) {
      const x = rnd() * w
      const y = rnd() * h
      for (let r = 14; r > 1; r -= 2.5) {
        ctx.globalAlpha = 0.12
        ctx.strokeStyle = veta
        ctx.beginPath()
        ctx.ellipse(x, y, r * 2.4, r, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
    // tablas (para el piso)
    if (tablas > 0) {
      const alto = h / tablas
      for (let i = 0; i < tablas; i++) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(0, i * alto, w, 2)
        const corte = rnd() * w
        ctx.fillRect(corte, i * alto, 2, alto)
        ctx.fillStyle = `rgba(${rnd() > 0.5 ? 255 : 0},0,0,${rnd() * 0.06})`
        ctx.fillRect(0, i * alto, w, alto)
      }
    }
    granulado(ctx, w, h, rnd, 6000, 0.06)
  }, { repetir })
}

// ─── papel tapiz damasco ─────────────────────────────────────────────────────
function motivoDamasco(ctx, x, y, s) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.beginPath()
  // mitad derecha + espejo
  for (const lado of [1, -1]) {
    ctx.save()
    ctx.scale(lado, 1)
    ctx.moveTo(0, -60)
    ctx.bezierCurveTo(14, -40, 30, -34, 22, -14)
    ctx.bezierCurveTo(44, -22, 52, 2, 34, 10)
    ctx.bezierCurveTo(46, 24, 30, 40, 16, 30)
    ctx.bezierCurveTo(18, 44, 8, 52, 0, 62)
    ctx.moveTo(0, -30)
    ctx.bezierCurveTo(8, -18, 10, -8, 0, 0)
    ctx.restore()
  }
  ctx.fill()
  // centro: rombo y gota
  ctx.beginPath()
  ctx.moveTo(0, -8)
  ctx.lineTo(8, 6)
  ctx.lineTo(0, 20)
  ctx.lineTo(-8, 6)
  ctx.closePath()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()
}

export function texturaPapelTapiz() {
  return crearTextura('tapiz', 512, 512, (ctx, w, h) => {
    const rnd = aleatorio(3)
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, '#2b0d17')
    g.addColorStop(0.5, '#33111c')
    g.addColorStop(1, '#2b0d17')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    // rayas finas
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(x, 0, 2, h)
    }
    ctx.fillStyle = 'rgba(92, 34, 48, 0.75)'
    const pos = [
      [128, 128], [384, 384], [384, -128], [-128, 384], [640, 384], [384, 640],
    ]
    for (const [x, y] of pos) motivoDamasco(ctx, x, y, 1.6)
    ctx.fillStyle = 'rgba(160, 120, 70, 0.18)'
    for (const [x, y] of [[384, 128], [128, 384], [-128, 128], [640, 128], [128, 640], [128, -128], [384, -128 + 256 * 3]]) motivoDamasco(ctx, x, y, 0.7)
    granulado(ctx, w, h, rnd, 9000, 0.05)
  }, { repetir: [5, 2.2] })
}

// ─── alfombra ────────────────────────────────────────────────────────────────
export function texturaAlfombra() {
  return crearTextura('alfombra', 1024, 640, (ctx, w, h) => {
    const rnd = aleatorio(11)
    ctx.fillStyle = '#3a0c14'
    ctx.fillRect(0, 0, w, h)
    const marco = (m, color, lw) => {
      ctx.strokeStyle = color
      ctx.lineWidth = lw
      ctx.strokeRect(m, m, w - m * 2, h - m * 2)
    }
    marco(20, '#1a0508', 30)
    marco(52, '#8a6a3a', 4)
    marco(70, '#1a0508', 16)
    marco(90, '#8a6a3a', 2)
    ctx.fillStyle = 'rgba(138,106,58,0.35)'
    motivoDamasco(ctx, w / 2, h / 2, 2.6)
    ctx.fillStyle = 'rgba(20,4,8,0.6)'
    motivoDamasco(ctx, w / 2, h / 2, 1.4)
    for (const [x, y] of [[180, 160], [w - 180, 160], [180, h - 160], [w - 180, h - 160]]) {
      ctx.fillStyle = 'rgba(138,106,58,0.25)'
      motivoDamasco(ctx, x, y, 0.8)
    }
    granulado(ctx, w, h, rnd, 30000, 0.08)
  })
}

// ─── lomos de libros ─────────────────────────────────────────────────────────
function dibujarAdorno(ctx, tipo, x, y, s) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.beginPath()
  switch (tipo) {
    case 'luna':
      ctx.arc(0, 0, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(8, -5, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      break
    case 'rosa':
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        ctx.moveTo(0, 0)
        ctx.arc(Math.cos(a) * 9, Math.sin(a) * 9, 9, 0, Math.PI * 2)
      }
      ctx.fill()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(0, 0, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath()
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'llave':
      ctx.lineWidth = 4
      ctx.arc(0, -12, 8, 0, Math.PI * 2)
      ctx.moveTo(0, -4)
      ctx.lineTo(0, 22)
      ctx.moveTo(0, 14)
      ctx.lineTo(8, 14)
      ctx.moveTo(0, 20)
      ctx.lineTo(6, 20)
      ctx.stroke()
      break
    case 'cuervo':
      ctx.moveTo(-20, 4)
      ctx.quadraticCurveTo(-6, -18, 4, -6)
      ctx.quadraticCurveTo(10, -14, 18, -10)
      ctx.lineTo(12, -6)
      ctx.quadraticCurveTo(14, 8, 2, 10)
      ctx.lineTo(-6, 18)
      ctx.lineTo(-4, 8)
      ctx.closePath()
      ctx.fill()
      break
    case 'estrella':
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 7 : 19
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2
        i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      ctx.closePath()
      ctx.fill()
      break
    case 'corazon':
    default:
      ctx.moveTo(0, 16)
      ctx.bezierCurveTo(-24, 0, -14, -20, 0, -8)
      ctx.bezierCurveTo(14, -20, 24, 0, 0, 16)
      ctx.fill()
  }
  ctx.restore()
}

function cuero(ctx, w, h, color, rnd) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
  // curvatura del lomo
  const g = ctx.createLinearGradient(0, 0, w, 0)
  g.addColorStop(0, 'rgba(0,0,0,0.55)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.06)')
  g.addColorStop(0.6, 'rgba(255,255,255,0.02)')
  g.addColorStop(1, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  granulado(ctx, w, h, rnd, w * h * 0.08, 0.12)
  // desgaste
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.05 + rnd() * 0.1})`
    ctx.beginPath()
    ctx.ellipse(rnd() * w, rnd() * h, 4 + rnd() * 10, 6 + rnd() * 20, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

function bandas(ctx, w, h, ys, oro) {
  ctx.fillStyle = oro
  for (const y of ys) {
    ctx.fillRect(w * 0.06, h * y, w * 0.88, h * 0.008)
    ctx.fillRect(w * 0.06, h * y + h * 0.016, w * 0.88, h * 0.003)
  }
}

// Lomo de un libro-proyecto: devuelve { mapa, brillo } (brillo = solo el dorado, para el hover)
export function texturaLomoProyecto(p, indice) {
  const dibujar = (soloOro) => (ctx, w, h) => {
    const rnd = aleatorio(indice * 31 + 5)
    const oro = soloOro ? '#ffffff' : '#c9a24a'
    if (soloOro) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
    } else {
      cuero(ctx, w, h, p.color, rnd)
    }
    bandas(ctx, w, h, [0.05, 0.1, 0.87, 0.92], oro)
    ctx.fillStyle = oro
    ctx.strokeStyle = oro
    dibujarAdorno(ctx, p.adorno, w / 2, h * 0.17, w / 70)
    // título vertical
    ctx.save()
    ctx.translate(w / 2, h * 0.53)
    ctx.rotate(Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    let tam = w * 0.42
    ctx.font = `600 ${tam}px Cinzel, serif`
    while (ctx.measureText(p.titulo).width > h * 0.6 && tam > 10) {
      tam -= 2
      ctx.font = `600 ${tam}px Cinzel, serif`
    }
    if (!soloOro) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillText(p.titulo, 2, 2)
    }
    ctx.fillStyle = oro
    ctx.fillText(p.titulo, 0, 0)
    ctx.restore()
    // rombos abajo
    for (let i = 0; i < 3; i++) {
      ctx.save()
      ctx.translate(w / 2, h * (0.8 + i * 0.022))
      ctx.rotate(Math.PI / 4)
      ctx.fillRect(-3, -3, 6, 6)
      ctx.restore()
    }
  }
  return {
    mapa: crearTextura(`lomo-p-${p.id}-${p.titulo}-${p.color}`, 160, 640, dibujar(false)),
    brillo: crearTextura(`lomo-b-${p.id}-${p.titulo}`, 160, 640, dibujar(true)),
  }
}

const paleta = ['#4a0f1a', '#2a0a12', '#16202f', '#1a2a1e', '#2a1730', '#120f12', '#5a3a1a', '#3a1010', '#24303a', '#40282a', '#1d1a24', '#4d1e2e']

export function texturaLomoGenerico(i) {
  return crearTextura(`lomo-g-${i}`, 64, 256, (ctx, w, h) => {
    const rnd = aleatorio(i * 97 + 13)
    cuero(ctx, w, h, paleta[i % paleta.length], rnd)
    const estilo = i % 4
    const oro = rnd() > 0.3 ? '#a8843c' : '#7d7368'
    if (estilo === 0) bandas(ctx, w, h, [0.08, 0.85], oro)
    if (estilo === 1) bandas(ctx, w, h, [0.12, 0.2, 0.3, 0.75, 0.85], oro)
    if (estilo === 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(w * 0.12, h * 0.25, w * 0.76, h * 0.25)
      ctx.strokeStyle = oro
      ctx.lineWidth = 1.5
      ctx.strokeRect(w * 0.15, h * 0.27, w * 0.7, h * 0.21)
      bandas(ctx, w, h, [0.06, 0.9], oro)
    }
    if (estilo === 3) {
      ctx.fillStyle = oro
      for (let k = 0; k < 6; k++) ctx.fillRect(w * 0.1, h * (0.1 + k * 0.15), w * 0.8, 2)
    }
    // "texto" ilegible
    ctx.fillStyle = oro
    ctx.globalAlpha = 0.8
    for (let k = 0; k < 5; k++) ctx.fillRect(w * 0.42, h * (0.34 + k * 0.03), w * 0.16, h * 0.012)
    ctx.globalAlpha = 1
  })
}

export function texturaPaginas() {
  return crearTextura('paginas', 64, 256, (ctx, w, h) => {
    ctx.fillStyle = '#cdbb92'
    ctx.fillRect(0, 0, w, h)
    for (let x = 0; x < w; x += 1.5) {
      ctx.fillStyle = `rgba(80,60,30,${Math.random() * 0.18})`
      ctx.fillRect(x, 0, 1, h)
    }
  })
}

// ─── pergamino escrito ───────────────────────────────────────────────────────
export const lineasPergamino = [
  'Bajo la lluvia escribo lo que el día no supo decir,',
  'cada línea es un hechizo, cada error un porvenir.',
  'Entre libros y velas aprendí a construir',
  'mundos hechos de código que se niegan a morir.',
  '',
  'Hoy dejo en estos estantes lo que el semestre me dio:',
  'noches largas, café frío y un sueño que creció.',
  'Y si el trueno me pregunta qué fue lo que',
]

export function texturaPergamino() {
  return crearTextura('pergamino', 1024, 1400, (ctx, w, h) => {
    const rnd = aleatorio(21)
    ctx.fillStyle = '#e6d3a6'
    ctx.fillRect(0, 0, w, h)
    // manchas
    for (let i = 0; i < 40; i++) {
      const x = rnd() * w
      const y = rnd() * h
      const r = 30 + rnd() * 160
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(150,110,50,${0.05 + rnd() * 0.08})`)
      g.addColorStop(1, 'rgba(150,110,50,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - r, y - r, r * 2, r * 2)
    }
    // bordes quemados/envejecidos
    const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75)
    v.addColorStop(0, 'rgba(90,55,20,0)')
    v.addColorStop(1, 'rgba(90,55,20,0.6)')
    ctx.fillStyle = v
    ctx.fillRect(0, 0, w, h)
    // fibras
    for (let i = 0; i < 900; i++) {
      ctx.strokeStyle = `rgba(110,80,40,${rnd() * 0.12})`
      ctx.lineWidth = 1
      ctx.beginPath()
      const x = rnd() * w
      const y = rnd() * h
      ctx.moveTo(x, y)
      ctx.lineTo(x + (rnd() - 0.5) * 40, y + (rnd() - 0.5) * 6)
      ctx.stroke()
    }
    // escritura
    ctx.fillStyle = '#2a170c'
    ctx.textBaseline = 'alphabetic'
    ctx.font = '78px "UnifrakturMaguntia", serif'
    ctx.fillText('Q', 110, 260)
    ctx.font = '44px "Pinyon Script", cursive'
    ctx.fillText('uerido diario de la tormenta,', 162, 250)
    let y = 360
    ctx.font = '42px "Pinyon Script", cursive'
    lineasPergamino.forEach((linea, i) => {
      ctx.save()
      ctx.globalAlpha = 0.82 + rnd() * 0.18
      ctx.translate(100 + rnd() * 8, y)
      ctx.rotate((rnd() - 0.5) * 0.012)
      ctx.fillText(linea, 0, 0)
      ctx.restore()
      if (i === lineasPergamino.length - 1) {
        // tinta fresca: brillo húmedo y una gota
        const ancho = ctx.measureText(linea).width
        ctx.fillStyle = '#120a05'
        ctx.beginPath()
        ctx.ellipse(110 + ancho + 26, y - 6, 9, 7, 0.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(110 + ancho + 46, y + 4, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#2a170c'
      }
      y += linea ? 92 : 60
    })
    // mancha de tinta vieja
    ctx.fillStyle = 'rgba(30,15,8,0.55)'
    ctx.beginPath()
    ctx.ellipse(820, 1210, 26, 18, 0.6, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 7; i++) {
      ctx.beginPath()
      ctx.arc(820 + (rnd() - 0.5) * 110, 1210 + (rnd() - 0.5) * 70, 2 + rnd() * 5, 0, Math.PI * 2)
      ctx.fill()
    }
    // anillo de taza de café
    ctx.strokeStyle = 'rgba(110,65,25,0.22)'
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.arc(250, 1170, 95, 0.3, Math.PI * 1.85)
    ctx.stroke()
  })
}

// ─── cielo nocturno con siluetas góticas ─────────────────────────────────────
export function texturaCielo() {
  return crearTextura('cielo', 1024, 1024, (ctx, w, h) => {
    const rnd = aleatorio(42)
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#05060c')
    g.addColorStop(0.5, '#141a2a')
    g.addColorStop(0.78, '#262a3c')
    g.addColorStop(1, '#1a1a26')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    // luna tras las nubes
    const lx = w * 0.7
    const ly = h * 0.24
    const halo = ctx.createRadialGradient(lx, ly, 0, lx, ly, 260)
    halo.addColorStop(0, 'rgba(210,215,235,0.55)')
    halo.addColorStop(0.12, 'rgba(180,190,220,0.25)')
    halo.addColorStop(1, 'rgba(120,130,170,0)')
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(225,228,240,0.85)'
    ctx.beginPath()
    ctx.arc(lx, ly, 34, 0, Math.PI * 2)
    ctx.fill()
    // nubes
    for (let i = 0; i < 260; i++) {
      const x = rnd() * w
      const y = rnd() * h * 0.75
      const r = 40 + rnd() * 140
      const c = ctx.createRadialGradient(x, y, 0, x, y, r)
      const tono = 30 + rnd() * 40
      c.addColorStop(0, `rgba(${tono},${tono + 4},${tono + 18},${0.1 + rnd() * 0.16})`)
      c.addColorStop(1, `rgba(${tono},${tono},${tono + 10},0)`)
      ctx.fillStyle = c
      ctx.fillRect(x - r, y - r, r * 2, r * 2)
    }
    // siluetas: colinas, árboles desnudos y agujas de una catedral
    ctx.fillStyle = '#030305'
    ctx.beginPath()
    ctx.moveTo(0, h)
    for (let x = 0; x <= w; x += 16) ctx.lineTo(x, h * 0.86 - Math.sin(x * 0.006) * 30 - Math.sin(x * 0.021) * 10)
    ctx.lineTo(w, h)
    ctx.fill()
    const aguja = (x, base, ancho, alto) => {
      ctx.beginPath()
      ctx.moveTo(x - ancho / 2, base)
      ctx.lineTo(x - ancho / 2, base - alto * 0.6)
      ctx.lineTo(x, base - alto)
      ctx.lineTo(x + ancho / 2, base - alto * 0.6)
      ctx.lineTo(x + ancho / 2, base)
      ctx.fill()
      ctx.fillRect(x - 1.5, base - alto - 24, 3, 24)
    }
    const cx = w * 0.3
    const base = h * 0.84
    ctx.fillRect(cx - 120, base - 120, 240, 130)
    aguja(cx - 90, base - 110, 46, 230)
    aguja(cx + 90, base - 110, 46, 230)
    aguja(cx, base - 110, 70, 330)
    for (let k = -3; k <= 3; k++) aguja(cx + k * 30, base - 120, 10, 50)
    // ventana encendida (alguien más está despierto)
    ctx.fillStyle = 'rgba(255,170,80,0.85)'
    ctx.fillRect(cx - 6, base - 250, 6, 12)
    ctx.fillStyle = '#030305'
    const arbol = (x, y, largo, ang, grosor, n) => {
      if (n === 0 || largo < 4) return
      const x2 = x + Math.cos(ang) * largo
      const y2 = y + Math.sin(ang) * largo
      ctx.strokeStyle = '#030305'
      ctx.lineWidth = grosor
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      arbol(x2, y2, largo * (0.68 + rnd() * 0.12), ang - 0.3 - rnd() * 0.35, grosor * 0.68, n - 1)
      arbol(x2, y2, largo * (0.68 + rnd() * 0.12), ang + 0.3 + rnd() * 0.35, grosor * 0.68, n - 1)
    }
    arbol(w * 0.82, h * 0.9, 120, -Math.PI / 2, 14, 8)
    arbol(w * 0.06, h * 0.92, 90, -Math.PI / 2 + 0.1, 10, 7)
    arbol(w * 0.6, h * 0.9, 60, -Math.PI / 2 - 0.1, 7, 6)
  })
}

// ─── pluma (con transparencia) ───────────────────────────────────────────────
export function texturaPluma() {
  return crearTextura('pluma', 128, 512, (ctx, w, h) => {
    const rnd = aleatorio(77)
    ctx.clearRect(0, 0, w, h)
    const cx = w / 2
    const arriba = 12
    const abajo = 400
    // barbas
    for (let y = arriba; y < abajo; y += 1.2) {
      const t = (y - arriba) / (abajo - arriba)
      const env = Math.pow(Math.sin(Math.PI * (0.06 + t * 0.9)), 0.55) * (1 - t * 0.25)
      // pequeñas separaciones entre barbas (como en una pluma real)
      const hueco = rnd() > 0.985
      if (hueco) y += 3
      for (const lado of [-1, 1]) {
        const largo = (lado < 0 ? 54 : 40) * env * (0.9 + rnd() * 0.12)
        const tono = 14 + rnd() * 20
        const g = ctx.createLinearGradient(cx, y, cx + lado * largo, y - largo * 0.45)
        g.addColorStop(0, `rgba(${tono + 6},${tono},${tono + 14},1)`)
        g.addColorStop(0.7, `rgba(${tono + 30},${tono + 18},${tono + 48},0.95)`)
        g.addColorStop(1, `rgba(${tono + 60},${tono + 40},${tono + 80},0)`)
        ctx.strokeStyle = g
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.moveTo(cx, y)
        ctx.quadraticCurveTo(cx + lado * largo * 0.5, y - largo * 0.15, cx + lado * largo, y - largo * 0.45)
        ctx.stroke()
      }
    }
    // plumón esponjoso en la base
    for (let i = 0; i < 90; i++) {
      const y = abajo - 10 + rnd() * 50
      const lado = rnd() > 0.5 ? 1 : -1
      const largo = 6 + rnd() * 22
      ctx.strokeStyle = `rgba(70,60,80,${0.3 + rnd() * 0.4})`
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(cx, y)
      ctx.bezierCurveTo(cx + lado * largo * 0.3, y - 8, cx + lado * largo * 0.8, y + 6, cx + lado * largo, y - rnd() * 10)
      ctx.stroke()
    }
    // raquis (eje central)
    const r = ctx.createLinearGradient(0, arriba, 0, h)
    r.addColorStop(0, 'rgba(40,30,40,1)')
    r.addColorStop(0.75, 'rgba(190,175,150,1)')
    r.addColorStop(1, 'rgba(225,210,180,1)')
    ctx.strokeStyle = r
    ctx.lineCap = 'round'
    for (let y = arriba; y < h - 4; y += 4) {
      const t = (y - arriba) / (h - arriba)
      ctx.lineWidth = 1 + t * 3.2
      ctx.beginPath()
      ctx.moveTo(cx, y)
      ctx.lineTo(cx, y + 4.5)
      ctx.stroke()
    }
  })
}
