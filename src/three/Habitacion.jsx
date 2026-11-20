import { useMemo } from 'react'
import * as THREE from 'three'
import { HAB, VENTANA, contornoOjival } from './escena'
import { texturaAlfombra, texturaMadera, texturaPapelTapiz } from './texturas'

function clonarRepeticion(tex, rx, ry) {
  const t = tex.clone()
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  t.needsUpdate = true
  return t
}

// Zócalo de paneles de madera
function Zocalo({ largo, alto = 1.05, ...props }) {
  const madera = useMemo(() => texturaMadera({ base: '#24130c', veta: '#0d0604', semilla: 4 }), [])
  const paneles = Math.max(1, Math.round(largo / 0.9))
  const anchoPanel = largo / paneles
  return (
    <group {...props}>
      <mesh position={[0, alto / 2, 0.02]} receiveShadow>
        <boxGeometry args={[largo, alto, 0.04]} />
        <meshStandardMaterial map={madera} roughness={0.7} />
      </mesh>
      {/* moldura superior */}
      <mesh position={[0, alto, 0.05]}>
        <boxGeometry args={[largo, 0.06, 0.07]} />
        <meshStandardMaterial map={madera} color="#5a3a26" roughness={0.5} />
      </mesh>
      {/* rodapié */}
      <mesh position={[0, 0.08, 0.05]}>
        <boxGeometry args={[largo, 0.16, 0.06]} />
        <meshStandardMaterial map={madera} color="#3a2418" roughness={0.6} />
      </mesh>
      {Array.from({ length: paneles }, (_, i) => (
        <mesh key={i} position={[-largo / 2 + anchoPanel * (i + 0.5), alto * 0.55, 0.05]}>
          <boxGeometry args={[anchoPanel * 0.74, alto * 0.58, 0.02]} />
          <meshStandardMaterial map={madera} color="#6b4630" roughness={0.55} />
        </mesh>
      ))}
    </group>
  )
}

export default function Habitacion() {
  const { tapizFondo, tapizLado, piso, alfombra, techo, paredTrasera } = useMemo(() => {
    const tapiz = texturaPapelTapiz()
    const fondoProf = HAB.frenteZ - HAB.fondoZ

    // Pared trasera con hueco ojival para la ventana
    const forma = new THREE.Shape()
    const W = HAB.ancho / 2
    forma.moveTo(-W, 0)
    forma.lineTo(W, 0)
    forma.lineTo(W, HAB.alto)
    forma.lineTo(-W, HAB.alto)
    forma.closePath()
    const hueco = new THREE.Path(
      contornoOjival(VENTANA.ancho, VENTANA.altoRecto, VENTANA.altoArco).map(
        (p) => new THREE.Vector2(p.x + VENTANA.x, p.y + VENTANA.base),
      ),
    )
    forma.holes.push(hueco)
    const geo = new THREE.ExtrudeGeometry(forma, { depth: 0.3, bevelEnabled: false, curveSegments: 24 })
    geo.translate(0, 0, -0.3)

    return {
      paredTrasera: geo,
      // las UV del extruido están en metros: 1 repetición cada ~2 m
      tapizFondo: clonarRepeticion(tapiz, 0.5, 0.5),
      tapizLado: clonarRepeticion(tapiz, fondoProf / 2, HAB.alto / 2),
      piso: texturaMadera({ base: '#2b1810', veta: '#0e0704', semilla: 9, repetir: [3, 3], tablas: 6 }),
      alfombra: texturaAlfombra(),
      techo: texturaMadera({ base: '#1a0f0a', veta: '#050302', semilla: 2, repetir: [4, 4] }),
    }
  }, [])

  const prof = HAB.frenteZ - HAB.fondoZ
  const centroZ = (HAB.frenteZ + HAB.fondoZ) / 2

  return (
    <group>
      {/* piso */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, centroZ]} receiveShadow>
        <planeGeometry args={[HAB.ancho, prof]} />
        <meshStandardMaterial map={piso} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* alfombra */}
      <mesh rotation-x={-Math.PI / 2} position={[-0.3, 0.006, -1.9]} receiveShadow>
        <planeGeometry args={[4.4, 2.75]} />
        <meshStandardMaterial map={alfombra} roughness={0.95} />
      </mesh>

      {/* pared trasera */}
      <mesh geometry={paredTrasera} position={[0, 0, HAB.fondoZ]} castShadow receiveShadow>
        <meshStandardMaterial map={tapizFondo} roughness={0.85} />
      </mesh>
      <Zocalo largo={HAB.ancho} position={[0, 0, HAB.fondoZ]} />

      {/* paredes laterales */}
      <mesh position={[-HAB.ancho / 2, HAB.alto / 2, centroZ]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[prof, HAB.alto]} />
        <meshStandardMaterial map={tapizLado} roughness={0.85} />
      </mesh>
      <Zocalo largo={prof} position={[-HAB.ancho / 2, 0, centroZ]} rotation-y={Math.PI / 2} />
      <mesh position={[HAB.ancho / 2, HAB.alto / 2, centroZ]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[prof, HAB.alto]} />
        <meshStandardMaterial map={tapizLado} roughness={0.85} />
      </mesh>
      <Zocalo largo={prof} position={[HAB.ancho / 2, 0, centroZ]} rotation-y={-Math.PI / 2} />

      {/* techo con vigas */}
      <mesh position={[0, HAB.alto, centroZ]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[HAB.ancho, prof]} />
        <meshStandardMaterial map={techo} roughness={0.9} />
      </mesh>
      {[-3, -0.5, 2, 4.5].map((z) => (
        <mesh key={z} position={[0, HAB.alto - 0.12, z]}>
          <boxGeometry args={[HAB.ancho, 0.24, 0.26]} />
          <meshStandardMaterial map={techo} color="#5a4030" roughness={0.9} />
        </mesh>
      ))}
      {/* cornisa */}
      <mesh position={[0, HAB.alto - 0.08, HAB.fondoZ + 0.06]}>
        <boxGeometry args={[HAB.ancho, 0.16, 0.12]} />
        <meshStandardMaterial map={techo} color="#6a4a36" roughness={0.6} />
      </mesh>
    </group>
  )
}
