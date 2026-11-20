import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Perfil de la llama (forma de gota) para LatheGeometry
const perfilLlama = [
  [0, 0],
  [0.008, 0.004],
  [0.014, 0.016],
  [0.015, 0.03],
  [0.012, 0.047],
  [0.007, 0.066],
  [0.002, 0.085],
  [0, 0.095],
].map(([x, y]) => new THREE.Vector2(x, y))

const geoLlama = new THREE.LatheGeometry(perfilLlama, 20)

function ruido(t, s) {
  return Math.sin(t * 7.3 + s) * 0.5 + Math.sin(t * 13.1 + s * 2.1) * 0.3 + Math.sin(t * 23.7 + s * 3.3) * 0.2
}

export function Llama({ semilla = 0, escala = 1, luz = 0, distancia = 0, sombra = false }) {
  const grupo = useRef()
  const exterior = useRef()
  const luzRef = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const n = ruido(t, semilla)
    const n2 = ruido(t * 0.7, semilla + 4)
    if (grupo.current) {
      grupo.current.scale.set(escala * (1 - n * 0.06), escala * (1 + n * 0.14), escala * (1 - n * 0.06))
      grupo.current.rotation.z = n2 * 0.08
      grupo.current.rotation.x = n * 0.05
    }
    if (exterior.current) exterior.current.material.opacity = 0.75 + n * 0.12
    if (luzRef.current) {
      luzRef.current.intensity = luz * (1 + n * 0.12 + n2 * 0.06)
      luzRef.current.position.x = n2 * 0.01
    }
  })
  return (
    <group>
      <group ref={grupo}>
        <mesh ref={exterior} geometry={geoLlama}>
          <meshBasicMaterial
            color={[2.4, 0.8, 0.16]}
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh geometry={geoLlama} scale={[0.55, 0.62, 0.55]} position-y={0.004}>
          <meshBasicMaterial color={[3.4, 2.1, 0.8]} toneMapped={false} />
        </mesh>
        {/* base azulada de la llama */}
        <mesh position-y={0.006} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.006, 10, 8]} />
          <meshBasicMaterial color={[0.4, 0.6, 2.2]} transparent opacity={0.6} toneMapped={false} />
        </mesh>
      </group>
      {luz > 0 && (
        <pointLight
          ref={luzRef}
          position={[0, 0.06, 0]}
          color="#ff9a45"
          intensity={luz}
          distance={distancia}
          decay={2}
          castShadow={sombra}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.002}
          shadow-camera-near={0.05}
          shadow-camera-far={8}
        />
      )}
    </group>
  )
}

// Vela de cera con goteos. Origen en la base.
export default function Vela({ alto = 0.2, radio = 0.022, semilla = 1, luz = 0, distancia = 0, sombra = false, ...props }) {
  const goteos = useMemo(() => {
    const r = []
    let s = semilla * 9.13
    const rnd = () => {
      s = (s * 16807) % 2147483647
      return (s % 1000) / 1000
    }
    for (let i = 0; i < 7; i++) {
      const a = rnd() * Math.PI * 2
      const largo = 0.02 + rnd() * alto * 0.45
      r.push({ a, largo })
    }
    return r
  }, [semilla, alto])

  const cera = (
    <meshPhysicalMaterial
      color="#efe3c6"
      roughness={0.45}
      transmission={0}
      sheen={0.5}
      sheenColor="#ffd9a0"
      emissive="#ff9a50"
      emissiveIntensity={0.08}
    />
  )

  return (
    <group {...props}>
      <mesh position-y={alto / 2} receiveShadow>
        <cylinderGeometry args={[radio * 0.97, radio, alto, 24]} />
        {cera}
      </mesh>
      {/* borde derretido arriba */}
      <mesh position-y={alto - 0.002}>
        <torusGeometry args={[radio * 0.82, radio * 0.2, 8, 24]} />
        {cera}
      </mesh>
      {/* el resplandor interior de la cera cerca de la llama */}
      <mesh position-y={alto - 0.012}>
        <cylinderGeometry args={[radio * 0.99, radio * 0.99, 0.022, 24, 1, true]} />
        <meshBasicMaterial color={[1.6, 0.9, 0.4]} transparent opacity={0.35} toneMapped={false} />
      </mesh>
      {goteos.map((g, i) => (
        <mesh
          key={i}
          position={[Math.cos(g.a) * radio * 0.98, alto - g.largo / 2, Math.sin(g.a) * radio * 0.98]}
          scale={[1, g.largo / 0.02, 1]}
        >
          <capsuleGeometry args={[radio * 0.14, 0.012, 4, 8]} />
          {cera}
        </mesh>
      ))}
      {/* pabilo */}
      <mesh position-y={alto + 0.008}>
        <cylinderGeometry args={[0.0012, 0.0015, 0.016, 6]} />
        <meshBasicMaterial color="#120a05" />
      </mesh>
      <group position-y={alto + 0.01}>
        <Llama semilla={semilla} luz={luz} distancia={distancia} sombra={sombra} />
      </group>
    </group>
  )
}
