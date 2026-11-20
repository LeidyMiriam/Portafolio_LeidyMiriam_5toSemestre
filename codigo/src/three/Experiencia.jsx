import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, Noise, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode, BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import Habitacion from './Habitacion'
import Ventana from './Ventana'
import Escritorio from './Escritorio'
import Estanteria from './Estanteria'
import { ESCRITORIO, ESTANTE, VISTAS } from './escena'
import { tormenta, useStore } from '../store'

// ─── cámara: transiciones suaves entre vistas + paralaje con el mouse ────────
function Camara() {
  const { camera, size } = useThree()
  const vista = useStore((s) => s.vista)
  const entrado = useStore((s) => s.entrado)
  const pos = useRef(new THREE.Vector3(0.6, 2.6, 4.5))
  const mira = useRef(new THREE.Vector3(...VISTAS.habitacion.mira))
  const puntero = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const mover = (e) => {
      puntero.current.x = (e.clientX / window.innerWidth) * 2 - 1
      puntero.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', mover)
    return () => window.removeEventListener('pointermove', mover)
  }, [])

  // en pantallas angostas (celular vertical) abrimos el campo de visión
  useEffect(() => {
    const aspecto = size.width / size.height
    const hfov = vista === 'habitacion' ? 78 : 62
    const vfov = (2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(hfov / 2)) / aspecto) * 180) / Math.PI
    camera.userData.fovObjetivo = THREE.MathUtils.clamp(vfov, 45, 82)
  }, [size, vista, camera])

  const destinoPos = useMemo(() => new THREE.Vector3(), [])
  const destinoMira = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dt) => {
    const v = VISTAS[entrado ? vista : 'habitacion']
    const p = puntero.current
    const fuerza = vista === 'habitacion' ? 0.28 : 0.1
    destinoPos.set(v.pos[0] + p.x * fuerza, v.pos[1] - p.y * fuerza * 0.5, v.pos[2])
    if (!entrado) destinoPos.z += 1.6 // antes de entrar, la cámara espera en el umbral
    destinoMira.set(v.mira[0] + p.x * fuerza * 0.4, v.mira[1] - p.y * fuerza * 0.3, v.mira[2])
    const k = 1 - Math.exp(-dt * (entrado ? 2.2 : 1))
    pos.current.lerp(destinoPos, k)
    mira.current.lerp(destinoMira, k)
    camera.position.copy(pos.current)
    camera.lookAt(mira.current)
    const fovObj = camera.userData.fovObjetivo ?? 50
    if (Math.abs(camera.fov - fovObj) > 0.01) {
      camera.fov += (fovObj - camera.fov) * k
      camera.updateProjectionMatrix()
    }
  })
  return null
}

// ─── iluminación ─────────────────────────────────────────────────────────────
function Luces() {
  const luna = useRef()
  const ambiente = useRef()
  const { scene } = useThree()
  const objetivo = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(-0.4, 0, -1)
    return o
  }, [])
  useEffect(() => {
    scene.add(objetivo)
    return () => scene.remove(objetivo)
  }, [scene, objetivo])

  useFrame(() => {
    const f = tormenta.destello
    luna.current.intensity = 0.32 + f * 18
    ambiente.current.intensity = 0.42 + f * 0.9
  })

  return (
    <>
      <ambientLight ref={ambiente} color="#5a4870" intensity={0.42} />
      <hemisphereLight args={['#33406a', '#2a1408', 0.45]} />
      {/* luz de luna / relámpago que entra por la ventana: proyecta la tracería en el piso */}
      <directionalLight
        ref={luna}
        color="#9fb0e6"
        position={[-2.9, 6.2, -10]}
        target={objetivo}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-radius={4}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={22}
      />
      {/* resplandor cálido que rebota de las velas hacia la estantería */}
      <pointLight color="#ff8a3d" position={[ESTANTE.x - 0.5, 2.2, -2.2]} intensity={3.2} decay={2} />
      <pointLight color="#ff7a35" position={[ESTANTE.x + 0.3, 0.9, -2.6]} intensity={1.2} decay={2} />
      <pointLight color="#ff9a50" position={[ESCRITORIO.x + 0.4, 1.6, -1.9]} intensity={0.9} decay={2} />
      <pointLight color="#c0603a" position={[0.4, 3.2, 0.5]} intensity={1.6} decay={2} />
    </>
  )
}

export default function Experiencia() {
  return (
    <>
      <color attach="background" args={['#050307']} />
      <fog attach="fog" args={['#07050a', 7, 18]} />
      <Camara />
      <Luces />
      <Habitacion />
      <Ventana />
      <Escritorio />
      <Estanteria />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={1.15} radius={0.75} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.25} darkness={0.85} />
        <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.08} />
      </EffectComposer>
    </>
  )
}
