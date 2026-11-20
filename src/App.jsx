import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Experiencia from './three/Experiencia'
import Intro from './ui/Intro'
import Interfaz from './ui/Interfaz'
import LibroAbierto from './ui/LibroAbierto'
import Carta from './ui/Carta'
import Indice from './ui/Indice'
import { useStore } from './store'

// Las texturas de los lomos y del pergamino se dibujan con estas fuentes,
// así que esperamos a que carguen antes de montar la escena 3D.
const FUENTES = ['600 40px Cinzel', '40px "Pinyon Script"', '40px "UnifrakturMaguntia"', '40px "Cinzel Decorative"']

function useFuentes() {
  const [listas, setListas] = useState(false)
  useEffect(() => {
    let vivo = true
    const limite = new Promise((r) => setTimeout(r, 4000))
    Promise.race([Promise.all(FUENTES.map((f) => document.fonts.load(f))), limite])
      .catch(() => {})
      .finally(() => vivo && setListas(true))
    return () => {
      vivo = false
    }
  }, [])
  return listas
}

export default function App() {
  const fuentes = useFuentes()
  const [escenaLista, setEscenaLista] = useState(false)
  const setHover = useStore((s) => s.setHover)

  return (
    <>
      {fuentes && (
        <Canvas
          className="lienzo"
          shadows={{ type: THREE.PCFShadowMap }}
          dpr={[1, 1.75]}
          camera={{ fov: 50, near: 0.02, far: 60, position: [0.6, 2.6, 4.5] }}
          gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
          onCreated={() => setEscenaLista(true)}
          onPointerMissed={() => setHover(null)}
        >
          <Suspense fallback={null}>
            <Experiencia />
          </Suspense>
        </Canvas>
      )}
      <Intro listo={fuentes && escenaLista} />
      <Interfaz />
      <LibroAbierto />
      <Carta />
      <Indice />
    </>
  )
}
