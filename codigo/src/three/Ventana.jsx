import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { HAB, VENTANA, contornoOjival } from './escena'
import { texturaCielo, texturaMadera } from './texturas'
import { tormenta, useStore } from '../store'
import { trueno } from '../audio/ambiente'

const W = VENTANA.ancho / 2
const ALTO_TOTAL = VENTANA.altoRecto + VENTANA.altoArco
const Z_PARED = HAB.fondoZ - 0.15 // mitad del grosor del muro
const Y_BARRAL = ALTO_TOTAL + 0.32 // relativo al alféizar
const ALTO_CORTINA = Y_BARRAL + VENTANA.base - 0.04 // llega casi al piso
const Y_AMARRE = Y_BARRAL - ALTO_CORTINA * 0.62

// ─── vidrio con gotas ────────────────────────────────────────────────────────
const vidrioVert = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const vidrioFrag = /* glsl */ `
  uniform float uTime;
  uniform float uFlash;
  varying vec2 vPos;
  float h1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
  float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 p = vPos;
    float a = 0.0;
    // gotas quietas
    vec2 g = p * 26.0;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float r = h2(id);
    if (r > 0.72) {
      vec2 off = vec2(h2(id + 3.1), h2(id + 7.7)) - 0.5;
      float d = length(f - off * 0.5);
      a += smoothstep(0.22 * r, 0.02, d) * 0.55;
    }
    // gotas que resbalan
    float cols = 11.0;
    float cx = p.x * cols;
    float cid = floor(cx);
    float fx = fract(cx) - 0.5;
    float vel = 0.08 + h1(cid) * 0.22;
    float H = 2.6;
    float y = fract(-uTime * vel + h1(cid + 9.0)) * H;
    float dy = p.y - y;
    float wob = sin(p.y * 9.0 + cid) * 0.12;
    float dx = (fx - wob) / cols;
    float d = length(vec2(dx, dy * 0.75));
    a += smoothstep(0.013, 0.004, d);
    float rastro = clamp(1.0 - dy / 0.35, 0.0, 1.0) * step(0.0, dy);
    a += rastro * smoothstep(0.004, 0.0, abs(dx)) * 0.45;
    a = clamp(a, 0.0, 1.0);

    vec3 base = vec3(0.04, 0.05, 0.08);
    vec3 brillo = vec3(0.55, 0.62, 0.78) * (0.6 + uFlash * 5.0);
    gl_FragColor = vec4(mix(base, brillo, a), 0.12 + a * 0.55);
    #include <colorspace_fragment>
  }
`

function Vidrio() {
  const mat = useRef()
  const geo = useMemo(
    () => new THREE.ShapeGeometry(new THREE.Shape(contornoOjival(VENTANA.ancho, VENTANA.altoRecto, VENTANA.altoArco)), 24),
    [],
  )
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uFlash: { value: 0 } }), [])
  useFrame((_, dt) => {
    uniforms.uTime.value += dt
    uniforms.uFlash.value = tormenta.destello
  })
  return (
    <mesh geometry={geo} position={[0, 0, 0]}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={vidrioVert}
        fragmentShader={vidrioFrag}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

// ─── marco ───────────────────────────────────────────────────────────────────
function Marco() {
  const madera = useMemo(() => texturaMadera({ base: '#1d0f09', veta: '#070302', semilla: 13 }), [])
  const geoMarco = useMemo(() => {
    const ext = new THREE.Shape(contornoOjival(VENTANA.ancho, VENTANA.altoRecto, VENTANA.altoArco, 0.11))
    ext.holes.push(new THREE.Path(contornoOjival(VENTANA.ancho, VENTANA.altoRecto, VENTANA.altoArco)))
    const g = new THREE.ExtrudeGeometry(ext, { depth: 0.42, bevelEnabled: false, curveSegments: 24 })
    g.translate(0, 0, -0.27)
    return g
  }, [])
  const mat = <meshStandardMaterial map={madera} color="#7a5640" roughness={0.6} />
  const barra = 0.035
  return (
    <group>
      <mesh geometry={geoMarco} castShadow receiveShadow>
        {mat}
      </mesh>
      {/* parteluz vertical */}
      <mesh position={[0, ALTO_TOTAL / 2, 0]} castShadow>
        <boxGeometry args={[barra, ALTO_TOTAL, barra * 1.4]} />
        {mat}
      </mesh>
      {/* travesaños */}
      {[VENTANA.altoRecto * 0.5, VENTANA.altoRecto].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[VENTANA.ancho, barra, barra * 1.4]} />
          {mat}
        </mesh>
      ))}
      {/* tracería: rosetón en el arco */}
      <mesh position={[0, VENTANA.altoRecto + VENTANA.altoArco * 0.38, 0]} castShadow>
        <torusGeometry args={[0.2, barra / 2, 8, 40]} />
        {mat}
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.1, VENTANA.altoRecto + VENTANA.altoArco * 0.38 + Math.sin(a) * 0.1, 0]}
            castShadow
          >
            <torusGeometry args={[0.085, barra / 3, 6, 24]} />
            {mat}
          </mesh>
        )
      })}
      {/* alféizar */}
      <mesh position={[0, -0.04, 0.12]} castShadow receiveShadow>
        <boxGeometry args={[VENTANA.ancho + 0.4, 0.08, 0.36]} />
        {mat}
      </mesh>
    </group>
  )
}

// ─── cortinas de terciopelo ──────────────────────────────────────────────────
function Cortina({ lado }) {
  const geo = useMemo(() => {
    const ancho = 0.72
    const alto = ALTO_CORTINA
    const g = new THREE.PlaneGeometry(ancho, alto, 60, 40)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const t = 1 - (y + alto / 2) / alto // 0 arriba, 1 abajo
      // recogido: a 2/3 de altura la tela se junta hacia el lado exterior
      const amarre = Math.exp(-((t - 0.62) ** 2) / 0.02)
      const recoger = 1 - amarre * 0.55
      // el borde exterior queda fijo; la tela se junta hacia afuera
      const xb = ancho / 2 - (ancho / 2 - x) * recoger
      const pliegue = Math.sin((x + ancho / 2) * 34) * (0.035 + t * 0.02) * (1 + amarre)
      pos.setXYZ(i, xb * lado, y, pliegue + amarre * 0.06)
    }
    g.computeVertexNormals()
    g.translate((ancho / 2) * lado, 0, 0)
    return g
  }, [lado])
  return (
    <mesh geometry={geo} position={[lado * (W - 0.08), Y_BARRAL - ALTO_CORTINA / 2 + 0.03, 0.32]} castShadow receiveShadow>
      <meshPhysicalMaterial
        color="#3e0710"
        roughness={0.85}
        sheen={0.6}
        sheenColor="#8a2433"
        sheenRoughness={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function Barral() {
  const y = Y_BARRAL
  const latón = <meshStandardMaterial color="#8a6a32" metalness={0.9} roughness={0.35} />
  return (
    <group position={[0, y, 0.36]}>
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.018, 0.018, VENTANA.ancho + 1.75, 12]} />
        {latón}
      </mesh>
      {[-1, 1].map((l) => (
        <group key={l} position={[l * (VENTANA.ancho / 2 + 0.88), 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.04, 16, 12]} />
            {latón}
          </mesh>
          <mesh position={[l * 0.06, 0, 0]} rotation-z={(-l * Math.PI) / 2}>
            <coneGeometry args={[0.028, 0.09, 12]} />
            {latón}
          </mesh>
        </group>
      ))}
      {/* anillas para los amarres */}
      {[-1, 1].map((l) => (
        <mesh key={'a' + l} position={[l * (W + 0.45), Y_AMARRE - Y_BARRAL, 0.05]}>
          <torusGeometry args={[0.05, 0.008, 8, 24]} />
          {latón}
        </mesh>
      ))}
    </group>
  )
}

// ─── exterior: cielo, lluvia y relámpagos ────────────────────────────────────
function Cielo() {
  const mat = useRef()
  const tex = useMemo(() => texturaCielo(), [])
  useFrame(() => {
    const f = 1 + tormenta.destello * 6
    mat.current.color.setRGB(f * 0.95, f, f * 1.15)
  })
  return (
    <mesh position={[0.6, 2.3, -9 - Z_PARED]}>
      <planeGeometry args={[18, 13]} />
      <meshBasicMaterial ref={mat} map={tex} fog={false} />
    </mesh>
  )
}

function Lluvia({ cantidad = 1600 }) {
  const ref = useRef()
  const { geo, vel } = useMemo(() => {
    const pos = new Float32Array(cantidad * 6)
    const vel = new Float32Array(cantidad)
    for (let i = 0; i < cantidad; i++) {
      const x = (Math.random() - 0.5) * 7
      const y = Math.random() * 8 - 1.5
      const z = -0.4 - Math.random() * 5.5
      const largo = 0.14 + Math.random() * 0.12
      pos.set([x, y, z, x - 0.02, y + largo, z], i * 6)
      vel[i] = 7 + Math.random() * 4
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geo: g, vel }
  }, [cantidad])
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05)
    const arr = geo.attributes.position.array
    for (let i = 0; i < cantidad; i++) {
      const k = i * 6
      const dy = vel[i] * d
      arr[k + 1] -= dy
      arr[k + 4] -= dy
      arr[k] -= dy * 0.08
      arr[k + 3] -= dy * 0.08
      if (arr[k + 1] < -1.5) {
        const sube = 8 + Math.random()
        arr[k + 1] += sube
        arr[k + 4] += sube
        const nx = (Math.random() - 0.5) * 7
        const larg = arr[k + 3] - arr[k]
        arr[k] = nx
        arr[k + 3] = nx + larg
      }
    }
    geo.attributes.position.needsUpdate = true
    ref.current.material.opacity = 0.28 + tormenta.destello * 0.5
  })
  return (
    <lineSegments ref={ref} geometry={geo}>
      <lineBasicMaterial color="#9aa6c4" transparent opacity={0.3} depthWrite={false} />
    </lineSegments>
  )
}

function crearRayo() {
  const pts = []
  let x = (Math.random() - 0.5) * 6
  let y = 7.5
  pts.push([x, y, 0])
  while (y > 0.6) {
    y -= 0.18 + Math.random() * 0.35
    x += (Math.random() - 0.5) * 0.55
    pts.push([x, y, 0])
  }
  return pts
}

// Programa los relámpagos y publica la intensidad en `tormenta.destello`
function Relampagos() {
  const [rayo, setRayo] = useState(() => crearRayo())
  const linea = useRef()
  const estado = useRef({ proximo: 3, inicio: -10, pulsos: [] })

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const e = estado.current
    if (t > e.proximo || tormenta.forzar) {
      tormenta.forzar = false
      const fuerza = 0.55 + Math.random() * 0.45
      e.inicio = t
      e.pulsos = [
        { t: 0, a: fuerza },
        { t: 0.09 + Math.random() * 0.08, a: fuerza * (0.4 + Math.random() * 0.4) },
        { t: 0.25 + Math.random() * 0.2, a: fuerza * (0.6 + Math.random() * 0.4) },
      ]
      e.proximo = t + 6 + Math.random() * 11
      setRayo(crearRayo())
      if (useStore.getState().sonido) trueno(fuerza, 0.5 + Math.random() * 1.6)
    }
    const dt = t - e.inicio
    let f = 0
    for (const p of e.pulsos) if (dt >= p.t) f = Math.max(f, p.a * Math.exp(-(dt - p.t) * 7))
    tormenta.destello = f
    if (linea.current) {
      linea.current.material.opacity = dt < 0.6 ? Math.min(1, f * 1.6) : 0
      linea.current.visible = dt < 0.6
    }
  })

  return (
    <Line
      ref={linea}
      points={rayo}
      color={[6, 6, 9]}
      lineWidth={2.2}
      transparent
      toneMapped={false}
      position={[0.5, 0, -8.6 - Z_PARED]}
    />
  )
}

export default function Ventana() {
  return (
    <group position={[VENTANA.x, VENTANA.base, Z_PARED]}>
      <group
        onClick={(e) => {
          e.stopPropagation()
          tormenta.forzar = true
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          useStore.getState().setHover('Invocar un trueno')
        }}
        onPointerOut={() => useStore.getState().setHover(null)}
      >
        <Vidrio />
      </group>
      <Marco />
      <Cortina lado={-1} />
      <Cortina lado={1} />
      <Barral />
      <group position={[0, -VENTANA.base, 0]}>
        <Cielo />
        <Lluvia />
        <Relampagos />
      </group>
    </group>
  )
}
