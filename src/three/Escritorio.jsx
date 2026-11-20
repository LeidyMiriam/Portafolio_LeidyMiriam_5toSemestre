import { useMemo } from 'react'
import * as THREE from 'three'
import { ESCRITORIO } from './escena'
import { texturaMadera, texturaPergamino, texturaPluma, texturaLomoGenerico, texturaPaginas } from './texturas'
import Vela from './Vela'
import { useStore } from '../store'

const Y = ESCRITORIO.alto // superficie de la mesa

const latón = { color: '#9a7638', metalness: 0.95, roughness: 0.32 }

// ─── mesa ────────────────────────────────────────────────────────────────────
function Mesa() {
  const madera = useMemo(() => texturaMadera({ base: '#2e1a10', veta: '#0f0704', semilla: 5 }), [])
  const geoPata = useMemo(() => {
    const p = [
      [0, 0], [0.045, 0], [0.05, 0.03], [0.032, 0.06], [0.028, 0.2], [0.04, 0.28], [0.03, 0.34],
      [0.024, 0.5], [0.03, 0.6], [0.042, 0.66], [0.03, 0.7], [0.036, 0.78], [0.036, 0.88], [0, 0.88],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(p, 20)
  }, [])
  const { ancho, fondo } = ESCRITORIO
  const mat = <meshStandardMaterial map={madera} roughness={0.45} metalness={0.05} />
  return (
    <group>
      {/* tablero con borde moldurado */}
      <mesh position-y={Y - 0.03} castShadow receiveShadow>
        <boxGeometry args={[ancho, 0.06, fondo]} />
        {mat}
      </mesh>
      <mesh position={[0, Y - 0.075, 0]} castShadow>
        <boxGeometry args={[ancho - 0.06, 0.03, fondo - 0.06]} />
        {mat}
      </mesh>
      {/* faldón */}
      <mesh position={[0, Y - 0.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[ancho - 0.16, 0.17, fondo - 0.16]} />
        {mat}
      </mesh>
      {/* cajones */}
      {[-0.55, 0.55].map((x) => (
        <group key={x} position={[x, Y - 0.17, fondo / 2 - 0.075]}>
          <mesh>
            <boxGeometry args={[0.7, 0.12, 0.02]} />
            <meshStandardMaterial map={madera} color="#7a5a40" roughness={0.5} />
          </mesh>
          <mesh position-z={0.02}>
            <sphereGeometry args={[0.016, 16, 12]} />
            <meshStandardMaterial {...latón} />
          </mesh>
          <mesh position-z={0.012}>
            <cylinderGeometry args={[0.03, 0.03, 0.004, 20]} />
            <meshStandardMaterial {...latón} />
          </mesh>
        </group>
      ))}
      {/* patas torneadas */}
      {[
        [-1, -1], [1, -1], [-1, 1], [1, 1],
      ].map(([sx, sz]) => (
        <mesh
          key={`${sx}${sz}`}
          geometry={geoPata}
          position={[sx * (ancho / 2 - 0.1), 0, sz * (fondo / 2 - 0.1)]}
          castShadow
        >
          {mat}
        </mesh>
      ))}
    </group>
  )
}

// ─── pergamino ───────────────────────────────────────────────────────────────
function Pergamino(props) {
  const tex = useMemo(() => texturaPergamino(), [])
  const ANCHO = 0.5
  const LARGO = 0.66
  // hoja casi plana con una ondulación suave
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(ANCHO, LARGO, 16, 16)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, 0.002 + Math.sin(pos.getX(i) * 9) * 0.0015)
    }
    g.rotateX(-Math.PI / 2)
    g.computeVertexNormals()
    return g
  }, [])
  const { abrirCarta, setHover } = useStore.getState()
  const papel = <meshStandardMaterial color="#d8bf8c" roughness={0.9} />
  return (
    <group
      {...props}
      onClick={(e) => {
        e.stopPropagation()
        abrirCarta()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover('Leer la carta')
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHover(null)
        document.body.style.cursor = ''
      }}
    >
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
      {/* rodillos de papel enrollado arriba y abajo */}
      {[
        [-LARGO / 2, 0.022],
        [LARGO / 2, 0.014],
      ].map(([z, r]) => (
        <mesh key={z} position={[0, r, z]} rotation-z={Math.PI / 2} castShadow receiveShadow>
          <cylinderGeometry args={[r, r, ANCHO + 0.01, 24]} />
          {papel}
        </mesh>
      ))}
    </group>
  )
}

// ─── pluma de cuervo ─────────────────────────────────────────────────────────
// Construida a lo largo de +x; la punta (plumín) está en el origen.
function Pluma(props) {
  const tex = useMemo(() => texturaPluma(), [])
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.085, 0.33, 8, 30)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // curvatura natural de la pluma y de las barbas
      pos.setZ(i, -((y / 0.33) ** 2) * 0.03 + Math.abs(x) * 0.12)
    }
    g.rotateZ(-Math.PI / 2)
    g.rotateX(-Math.PI / 2)
    g.translate(0.03 + 0.165, 0, 0)
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <group {...props}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial map={tex} alphaTest={0.35} side={THREE.DoubleSide} roughness={0.42} metalness={0.15} />
      </mesh>
      {/* plumín manchado de tinta */}
      <mesh position={[0.016, 0.002, 0]} rotation-z={-Math.PI / 2}>
        <coneGeometry args={[0.0035, 0.032, 10]} />
        <meshStandardMaterial color="#0d0806" roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[0.05, 0.003, 0]} rotation-z={-Math.PI / 2}>
        <cylinderGeometry args={[0.0032, 0.0035, 0.04, 10]} />
        <meshStandardMaterial color="#cdbf9e" roughness={0.35} />
      </mesh>
    </group>
  )
}

// ─── tintero ─────────────────────────────────────────────────────────────────
function Tintero(props) {
  return (
    <group {...props}>
      <mesh position-y={0.028} castShadow>
        <cylinderGeometry args={[0.036, 0.042, 0.056, 8]} />
        <meshPhysicalMaterial color="#10161a" roughness={0.05} metalness={0.1} clearcoat={1} transparent opacity={0.85} />
      </mesh>
      <mesh position-y={0.064}>
        <cylinderGeometry args={[0.016, 0.022, 0.018, 16]} />
        <meshPhysicalMaterial color="#10161a" roughness={0.05} clearcoat={1} />
      </mesh>
      <mesh position-y={0.074} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.0145, 20]} />
        <meshStandardMaterial color="#020103" roughness={0.02} metalness={0.4} />
      </mesh>
      {/* tapa de latón abierta, descansando a un lado */}
      <mesh position={[0.06, 0.006, 0.03]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.012, 20]} />
        <meshStandardMaterial {...latón} />
      </mesh>
      <mesh position={[0.06, 0.016, 0.03]}>
        <sphereGeometry args={[0.008, 12, 8]} />
        <meshStandardMaterial {...latón} />
      </mesh>
    </group>
  )
}

// ─── lentes redondos antiguos ────────────────────────────────────────────────
function Lentes(props) {
  const metal = <meshStandardMaterial color="#b08a48" metalness={1} roughness={0.25} />
  const r = 0.036
  const sep = 0.043
  const geoPatilla = useMemo(() => {
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -0.06),
      new THREE.Vector3(0, -0.006, -0.11),
      new THREE.Vector3(0, -0.02, -0.135),
      new THREE.Vector3(0, -0.032, -0.14),
    ])
    return new THREE.TubeGeometry(curva, 24, 0.0018, 6)
  }, [])
  return (
    // descansan apoyados sobre los aros y las patillas
    <group {...props}>
      <group position-y={r} rotation-x={-0.22}>
        {[-1, 1].map((l) => (
          <group key={l} position-x={l * sep}>
            <mesh castShadow>
              <torusGeometry args={[r, 0.0028, 10, 40]} />
              {metal}
            </mesh>
            <mesh>
              <circleGeometry args={[r, 32]} />
              <meshPhysicalMaterial
                color="#cfe0ff"
                transparent
                opacity={0.12}
                roughness={0}
                clearcoat={1}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <mesh geometry={geoPatilla} position={[l * (r + 0.001), 0.006, 0]} castShadow>
              {metal}
            </mesh>
          </group>
        ))}
        {/* puente */}
        <mesh position-y={0.006}>
          <torusGeometry args={[sep - r, 0.0022, 8, 16, Math.PI]} />
          {metal}
        </mesh>
      </group>
    </group>
  )
}

// ─── libros apilados y rosa seca ─────────────────────────────────────────────
function PilaLibros(props) {
  const paginas = useMemo(() => texturaPaginas(), [])
  const libros = [
    { w: 0.3, h: 0.055, d: 0.22, c: '#3a0d16', rot: 0.05, i: 1 },
    { w: 0.27, h: 0.045, d: 0.2, c: '#14202c', rot: -0.12, i: 2 },
    { w: 0.23, h: 0.04, d: 0.17, c: '#22142a', rot: 0.2, i: 4 },
  ]
  let y = 0
  return (
    <group {...props}>
      {libros.map((l) => {
        const lomo = texturaLomoGenerico(l.i)
        const yy = y + l.h / 2
        y += l.h
        const cubierta = <meshStandardMaterial color={l.c} roughness={0.6} />
        return (
          <group key={l.i} position-y={yy} rotation-y={l.rot}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[l.w - 0.008, l.h - 0.008, l.d - 0.012]} />
              <meshStandardMaterial map={paginas} roughness={0.9} />
            </mesh>
            {/* tapas */}
            <mesh position-y={l.h / 2 - 0.003} castShadow>
              <boxGeometry args={[l.w, 0.006, l.d]} />
              {cubierta}
            </mesh>
            <mesh position-y={-l.h / 2 + 0.003}>
              <boxGeometry args={[l.w, 0.006, l.d]} />
              {cubierta}
            </mesh>
            {/* lomo mirando al espectador */}
            <mesh position={[0, 0, l.d / 2 - 0.002]} rotation-z={Math.PI / 2}>
              <planeGeometry args={[l.h, l.w]} />
              <meshStandardMaterial map={lomo} roughness={0.6} />
            </mesh>
          </group>
        )
      })}
      <Rosa position={[0.02, y + 0.012, 0.01]} rotation={[Math.PI / 2 - 0.08, 0, 0.6]} />
    </group>
  )
}

function Rosa(props) {
  const petalo = <meshStandardMaterial color="#4a0710" roughness={0.65} side={THREE.DoubleSide} />
  const capas = [
    { n: 3, r: 0.012, apertura: 0.5, alto: 0.8 },
    { n: 5, r: 0.018, apertura: 0.85, alto: 0.7 },
    { n: 6, r: 0.024, apertura: 1.15, alto: 0.6 },
  ]
  return (
    <group {...props}>
      {/* tallo */}
      <mesh position-y={-0.13} castShadow>
        <cylinderGeometry args={[0.0022, 0.0026, 0.24, 6]} />
        <meshStandardMaterial color="#1d2414" roughness={0.8} />
      </mesh>
      {[-0.08, -0.17].map((y, i) => (
        <mesh key={y} position={[i ? -0.012 : 0.012, y, 0]} rotation-z={i ? 0.9 : -0.9} scale={[1, 0.35, 2]}>
          <sphereGeometry args={[0.013, 10, 6]} />
          <meshStandardMaterial color="#202a17" roughness={0.8} />
        </mesh>
      ))}
      {/* flor */}
      <group position-y={0.006}>
        {capas.map((c, ci) =>
          Array.from({ length: c.n }, (_, i) => (
            <mesh
              key={`${ci}-${i}`}
              rotation={[0, (i / c.n) * Math.PI * 2 + ci, 0]}
              position-y={(2 - ci) * 0.004}
              castShadow
            >
              <sphereGeometry args={[c.r, 12, 8, 0, Math.PI * 0.75, Math.PI - c.apertura - 0.6, c.apertura]} />
              {petalo}
            </mesh>
          )),
        )}
        <mesh position-y={-0.008} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.01, 12, 8]} />
          <meshStandardMaterial color="#1d2414" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}

// ─── candelero ───────────────────────────────────────────────────────────────
function Candelero(props) {
  const geo = useMemo(() => {
    const p = [
      [0, 0], [0.06, 0], [0.062, 0.008], [0.05, 0.014], [0.018, 0.03], [0.014, 0.06], [0.022, 0.075],
      [0.012, 0.09], [0.01, 0.15], [0.02, 0.16], [0.032, 0.17], [0.034, 0.178], [0, 0.178],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(p, 28)
  }, [])
  return (
    <group {...props}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial {...latón} />
      </mesh>
      <Vela position-y={0.178} alto={0.24} semilla={3} luz={2.6} />
    </group>
  )
}

function PlatoVelas(props) {
  return (
    <group {...props}>
      <mesh position-y={0.006} castShadow receiveShadow>
        <cylinderGeometry args={[0.085, 0.07, 0.012, 28]} />
        <meshStandardMaterial {...latón} />
      </mesh>
      {/* charco de cera */}
      <mesh position={[0.01, 0.013, 0]} scale={[1, 0.12, 0.8]}>
        <sphereGeometry args={[0.06, 20, 10]} />
        <meshStandardMaterial color="#e8dcc0" roughness={0.5} />
      </mesh>
      <Vela position={[-0.025, 0.012, 0.01]} alto={0.15} radio={0.02} semilla={7} luz={1.1} />
      <Vela position={[0.03, 0.012, -0.015]} alto={0.085} radio={0.024} semilla={11} />
    </group>
  )
}

export default function Escritorio() {
  const irA = useStore((s) => s.irA)
  return (
    <group
      position={[ESCRITORIO.x, 0, ESCRITORIO.z]}
      onClick={(e) => {
        e.stopPropagation()
        if (useStore.getState().vista !== 'escritorio') irA('escritorio')
      }}
    >
      <Mesa />
      <group position-y={Y}>
        <group position={[-0.02, 0, 0.1]} rotation-y={0.07}>
          <Pergamino />
          {/* la pluma descansa con la punta junto a la última palabra */}
          <Pluma position={[0.135, 0.004, 0.132]} rotation={[0, 0.55, 0.06]} />
        </group>
        <Tintero position={[0.42, 0, -0.18]} />
        <Lentes position={[-0.48, 0, 0.2]} rotation-y={0.55} />
        <PilaLibros position={[-0.78, 0, -0.22]} rotation-y={0.25} />
        <Candelero position={[0.82, 0, -0.3]} />
        <PlatoVelas position={[0.62, 0, -0.06]} />
      </group>
    </group>
  )
}
