import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ESTANTE, contornoOjival } from './escena'
import { aleatorio, texturaLomoGenerico, texturaLomoProyecto, texturaMadera, texturaPaginas } from './texturas'
import { proyectos } from '../data/proyectos'
import { useStore } from '../store'
import Vela from './Vela'

const GROSOR = 0.07
const ANCHO_INT = ESTANTE.ancho - GROSOR * 2
const NIVELES = [0.2, 1.02, 1.84, 2.66, 3.48] // base de cada repisa
const ALTO_HUECO = 0.78
const PROF_LIBRO = 0.3
const latón = { color: '#9a7638', metalness: 0.95, roughness: 0.32 }

// ─── materiales compartidos ──────────────────────────────────────────────────
const cacheMat = new Map()
function materialesGenericos(i) {
  if (cacheMat.has(i)) return cacheMat.get(i)
  const lomo = texturaLomoGenerico(i)
  const paginas = new THREE.MeshStandardMaterial({ map: texturaPaginas(), roughness: 0.95 })
  const color = lomo.image.getContext('2d').getImageData(32, 128, 1, 1).data
  const tapa = new THREE.MeshStandardMaterial({
    color: new THREE.Color(`rgb(${color[0]},${color[1]},${color[2]})`),
    roughness: 0.65,
  })
  const lomoMat = new THREE.MeshStandardMaterial({ map: lomo, roughness: 0.55, metalness: 0.05 })
  // orden de caras de BoxGeometry: +x, -x, +y, -y, +z (lomo), -z
  const arr = [tapa, tapa, paginas, paginas, lomoMat, tapa]
  cacheMat.set(i, arr)
  return arr
}

// ─── generación de cada repisa ───────────────────────────────────────────────
function generarFila(fila, proyectosFila, deco) {
  const rnd = aleatorio(fila * 1013 + 7)
  const items = []
  const inicio = -ANCHO_INT / 2 + 0.015
  let fin = ANCHO_INT / 2 - 0.015
  let x = inicio

  // reservar un extremo para decoración o una pila horizontal
  const ladoDeco = rnd() > 0.5 ? 'izq' : 'der'
  const reservado = deco ? 0.34 : proyectosFila.length === 0 && rnd() > 0.45 ? 0.34 : 0
  if (reservado) {
    const cx = ladoDeco === 'izq' ? inicio + reservado / 2 : fin - reservado / 2
    if (deco) items.push({ tipo: 'deco', deco, x: cx })
    else items.push({ tipo: 'pila', x: cx, n: 2 + Math.floor(rnd() * 3), semilla: fila })
    if (ladoDeco === 'izq') x += reservado
    else fin -= reservado
  }

  // posiciones objetivo de los libros-proyecto, repartidas en la fila
  const n = proyectosFila.length
  const objetivos = proyectosFila.map((p, k) => ({
    p,
    x: x + ((k + 0.5) / n) * (fin - x) + (rnd() - 0.5) * 0.15,
  }))

  let siguiente = 0
  let inclinarSiguiente = false
  while (x < fin - 0.04) {
    const obj = objetivos[siguiente]
    if (obj && x >= obj.x - 0.05) {
      const w = 0.095
      if (x + w > fin) break
      items.push({ tipo: 'proyecto', p: obj.p, x: x + w / 2, w, h: 0.6, d: PROF_LIBRO + 0.02 })
      x += w + 0.006
      siguiente++
      continue
    }
    // hueco ocasional, y el libro siguiente queda inclinado
    if (rnd() < 0.05 && !inclinarSiguiente) {
      x += 0.09 + rnd() * 0.04
      inclinarSiguiente = true
      continue
    }
    let w = 0.04 + rnd() * 0.05
    if (obj && x + w > obj.x - 0.05 && x < obj.x - 0.05) w = Math.max(0.035, obj.x - 0.05 - x)
    if (x + w > fin) break
    const h = 0.3 + rnd() * 0.24
    const d = PROF_LIBRO - rnd() * 0.025
    const variante = Math.floor(rnd() * 12)
    const ang = inclinarSiguiente ? 0.16 + rnd() * 0.06 : 0
    items.push({ tipo: 'libro', x, w, h, d, variante, ang })
    inclinarSiguiente = false
    x += w + 0.002 + rnd() * 0.004
  }
  return items
}

function LibroGenerico({ x, w, h, d, variante, ang }) {
  const mats = materialesGenericos(variante)
  // rota sobre su esquina inferior izquierda para apoyarse en el hueco
  return (
    <group position={[x, 0, -0.02 + (PROF_LIBRO - d) / 2]} rotation-z={ang}>
      <mesh position={[w / 2, h / 2, 0]} material={mats} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
    </group>
  )
}

function PilaHorizontal({ x, n, semilla }) {
  const rnd = aleatorio(semilla * 41 + 3)
  let y = 0
  const libros = Array.from({ length: n }, (_, i) => {
    const h = 0.04 + rnd() * 0.03
    const l = { y: y + h / 2, h, w: 0.24 + rnd() * 0.06, d: 0.2 + rnd() * 0.06, v: Math.floor(rnd() * 12), r: (rnd() - 0.5) * 0.2 }
    y += h
    return l
  })
  return (
    <group position={[x, 0, -0.04]}>
      {libros.map((l, i) => (
        <group key={i} position-y={l.y} rotation-y={l.r}>
          {/* acostado: el lomo queda hacia el frente */}
          <mesh rotation-z={Math.PI / 2} material={materialesGenericos(l.v)} castShadow receiveShadow>
            <boxGeometry args={[l.h, l.w, l.d]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── libro-proyecto interactivo ──────────────────────────────────────────────
function LibroProyecto({ p, indice, x, w, h, d }) {
  const grupo = useRef()
  const [hover, setHoverLocal] = useState(false)
  const abierto = useStore((s) => s.libroAbierto === p.id)
  const { abrirLibro, setHover } = useStore.getState()

  const { mats, lomoMat } = useMemo(() => {
    const { mapa, brillo } = texturaLomoProyecto(p, indice)
    const paginas = new THREE.MeshStandardMaterial({ map: texturaPaginas(), roughness: 0.95 })
    const tapa = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.55 })
    const lomoMat = new THREE.MeshStandardMaterial({
      map: mapa,
      emissiveMap: brillo,
      emissive: new THREE.Color('#ffc766'),
      emissiveIntensity: 0.06,
      roughness: 0.5,
      metalness: 0.1,
    })
    return { mats: [tapa, tapa, paginas, paginas, lomoMat, tapa], lomoMat }
  }, [p, indice])

  useEffect(() => () => (document.body.style.cursor = ''), [])

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 8)
    const g = grupo.current
    const zObj = abierto ? 0.32 : hover ? 0.1 : 0
    const yObj = abierto ? 0.04 : 0
    g.position.z += (zObj - g.position.z) * k
    g.position.y += (yObj - g.position.y) * k
    g.rotation.y += ((abierto ? -0.35 : 0) - g.rotation.y) * k
    const brillo = abierto ? 1.6 : hover ? 1.25 : 0.06 + Math.sin(performance.now() / 900 + indice) * 0.04 + 0.04
    lomoMat.emissiveIntensity += (brillo - lomoMat.emissiveIntensity) * k
  })

  return (
    <group position={[x, 0, -0.02 + (PROF_LIBRO - d) / 2]}>
      <group ref={grupo}>
        <mesh
          position-y={h / 2}
          material={mats}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation()
            abrirLibro(p.id)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHoverLocal(true)
            setHover(`${p.titulo} — ${p.subtitulo}`)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setHoverLocal(false)
            setHover(null)
            document.body.style.cursor = ''
          }}
        >
          <boxGeometry args={[w, h, d]} />
        </mesh>
        {/* cantoneras de latón */}
        {[0.012, h - 0.012].map((y) => (
          <mesh key={y} position={[0, y, d / 2 + 0.002]}>
            <boxGeometry args={[w + 0.004, 0.018, 0.006]} />
            <meshStandardMaterial {...latón} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ─── decoraciones ────────────────────────────────────────────────────────────
function RelojArena(props) {
  const geoVidrio = useMemo(() => {
    const p = []
    for (let i = 0; i <= 24; i++) {
      const t = i / 24
      const y = t * 0.2
      const r = 0.006 + 0.045 * Math.abs(Math.sin(Math.PI * t)) ** 0.7
      p.push(new THREE.Vector2(r, y))
    }
    return new THREE.LatheGeometry(p, 24)
  }, [])
  const madera = <meshStandardMaterial color="#2a160c" roughness={0.5} />
  return (
    <group {...props}>
      {[0, 0.215].map((y) => (
        <mesh key={y} position-y={y + 0.0075} castShadow>
          <cylinderGeometry args={[0.065, 0.065, 0.015, 24]} />
          {madera}
        </mesh>
      ))}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.055, 0.115, Math.sin(a) * 0.055]} castShadow>
            <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
            {madera}
          </mesh>
        )
      })}
      <mesh geometry={geoVidrio} position-y={0.015}>
        <meshPhysicalMaterial color="#d8e4f0" transparent opacity={0.22} roughness={0.05} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* arena */}
      <mesh position-y={0.05}>
        <coneGeometry args={[0.038, 0.06, 20]} />
        <meshStandardMaterial color="#c9a46a" roughness={0.9} />
      </mesh>
      <mesh position-y={0.18} rotation-x={Math.PI}>
        <coneGeometry args={[0.025, 0.035, 20]} />
        <meshStandardMaterial color="#c9a46a" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Frasco(props) {
  return (
    <group {...props}>
      <mesh position-y={0.07} castShadow>
        <sphereGeometry args={[0.06, 24, 16]} />
        <meshPhysicalMaterial color="#6a2030" transparent opacity={0.5} roughness={0.08} clearcoat={1} depthWrite={false} />
      </mesh>
      <mesh position-y={0.14}>
        <cylinderGeometry args={[0.018, 0.022, 0.04, 16]} />
        <meshPhysicalMaterial color="#6a2030" transparent opacity={0.5} roughness={0.08} />
      </mesh>
      <mesh position-y={0.168}>
        <cylinderGeometry args={[0.02, 0.017, 0.022, 12]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.9} />
      </mesh>
      {/* pétalos secos dentro */}
      {[...Array(7)].map((_, i) => (
        <mesh key={i} position={[Math.cos(i * 2.1) * 0.03, 0.03 + (i % 3) * 0.01, Math.sin(i * 2.1) * 0.03]} scale={[1, 0.3, 1]}>
          <sphereGeometry args={[0.014, 8, 6]} />
          <meshStandardMaterial color="#3a0610" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function Decoracion({ deco, x }) {
  if (deco === 'reloj') return <RelojArena position={[x, 0, -0.03]} />
  if (deco === 'frasco') return <Frasco position={[x, 0, -0.03]} />
  if (deco === 'vela')
    return (
      <group position={[x, 0, 0]}>
        <mesh position-y={0.008} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 0.016, 24]} />
          <meshStandardMaterial {...latón} />
        </mesh>
        <mesh position={[0.075, 0.03, 0]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.022, 0.005, 8, 16]} />
          <meshStandardMaterial {...latón} />
        </mesh>
        <Vela position-y={0.016} alto={0.13} radio={0.024} semilla={21} luz={1.4} />
      </group>
    )
  return null
}

// ─── mueble ──────────────────────────────────────────────────────────────────
function Mueble() {
  const madera = useMemo(() => texturaMadera({ base: '#26140c', veta: '#0b0503', semilla: 17 }), [])
  const { ancho, alto, fondo } = ESTANTE
  const mat = <meshStandardMaterial map={madera} roughness={0.55} />
  const geoCresta = useMemo(() => {
    const s = new THREE.Shape(contornoOjival(0.9, 0.06, 0.42))
    s.holes.push(new THREE.Path(contornoOjival(0.6, 0.06, 0.26).map((p) => new THREE.Vector2(p.x, p.y + 0.05))))
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false, curveSegments: 16 })
    return g
  }, [])
  return (
    <group>
      {/* fondo */}
      <mesh position={[0, alto / 2, -fondo / 2 + 0.01]} receiveShadow>
        <boxGeometry args={[ancho, alto, 0.02]} />
        <meshStandardMaterial map={madera} color="#6a5040" roughness={0.7} />
      </mesh>
      {/* laterales */}
      {[-1, 1].map((l) => (
        <mesh key={l} position={[l * (ancho / 2 - GROSOR / 2), alto / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[GROSOR, alto, fondo]} />
          {mat}
        </mesh>
      ))}
      {/* pilastras frontales */}
      {[-1, 1].map((l) => (
        <mesh key={'p' + l} position={[l * (ancho / 2 - GROSOR / 2), alto / 2, fondo / 2 + 0.015]} castShadow>
          <boxGeometry args={[GROSOR + 0.03, alto, 0.03]} />
          <meshStandardMaterial map={madera} color="#8a6a50" roughness={0.5} />
        </mesh>
      ))}
      {/* repisas */}
      {[...NIVELES, NIVELES[NIVELES.length - 1] + ALTO_HUECO].map((y, i) => (
        <group key={i}>
          <mesh position={[0, y - 0.02, 0]} castShadow receiveShadow>
            <boxGeometry args={[ANCHO_INT, 0.04, fondo - 0.02]} />
            {mat}
          </mesh>
          <mesh position={[0, y - 0.025, fondo / 2 - 0.005]}>
            <boxGeometry args={[ANCHO_INT, 0.05, 0.015]} />
            <meshStandardMaterial map={madera} color="#8a6a50" roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* zócalo */}
      <mesh position={[0, 0.09, 0.01]} castShadow>
        <boxGeometry args={[ancho + 0.04, 0.18, fondo + 0.02]} />
        {mat}
      </mesh>
      {/* cornisa y cresta gótica */}
      <mesh position={[0, alto + 0.05, 0.02]} castShadow>
        <boxGeometry args={[ancho + 0.14, 0.1, fondo + 0.08]} />
        {mat}
      </mesh>
      <mesh position={[0, alto + 0.12, 0.03]} castShadow>
        <boxGeometry args={[ancho + 0.2, 0.04, fondo + 0.12]} />
        <meshStandardMaterial map={madera} color="#8a6a50" roughness={0.5} />
      </mesh>
      <mesh geometry={geoCresta} position={[0, alto + 0.14, 0.05]} castShadow>
        {mat}
      </mesh>
      {[-1, 1].map((l) => (
        <group key={'r' + l} position={[l * (ancho / 2 + 0.03), alto + 0.14, 0.12]}>
          <mesh position-y={0.04}>
            <boxGeometry args={[0.07, 0.08, 0.07]} />
            {mat}
          </mesh>
          <mesh position-y={0.17}>
            <coneGeometry args={[0.035, 0.18, 4]} />
            {mat}
          </mesh>
          <mesh position-y={0.27}>
            <sphereGeometry args={[0.014, 10, 8]} />
            <meshStandardMaterial {...latón} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function Estanteria() {
  const irA = useStore((s) => s.irA)
  const filas = useMemo(() => {
    // prioriza las repisas a la altura de los ojos: 2, 1, 3, 0, 4
    const orden = [4, 3]
    const porFila = NIVELES.map(() => [])
    proyectos.forEach((p, i) => porFila[orden[i % orden.length]].push({ p, indice: i }))
    const decos = { 0: 'frasco', 1: 'reloj', 2: 'vela' }
    return NIVELES.map((y, f) => ({
      y,
      items: generarFila(f, porFila[f].map((o) => ({ ...o.p, _i: o.indice })), decos[f] ?? null),
    }))
  }, [])

  return (
    <group
      position={[ESTANTE.x, 0, ESTANTE.z]}
      onClick={(e) => {
        e.stopPropagation()
        if (useStore.getState().vista !== 'estanteria') irA('estanteria')
      }}
    >
      <Mueble />
      {filas.map((fila, f) => (
        <group key={f} position-y={fila.y}>
          {fila.items.map((it, k) => {
            if (it.tipo === 'libro') return <LibroGenerico key={k} {...it} />
            if (it.tipo === 'pila') return <PilaHorizontal key={k} {...it} />
            if (it.tipo === 'deco') return <Decoracion key={k} {...it} />
            if (it.tipo === 'proyecto')
              return <LibroProyecto key={it.p.id} p={it.p} indice={it.p._i} x={it.x} w={it.w} h={it.h} d={it.d} />
            return null
          })}
        </group>
      ))}
    </group>
  )
}
