import { useEffect, useRef } from 'react'
import { perfil } from '../data/perfil'
import { useStore } from '../store'
import { setSonido } from '../audio/ambiente'

const pistas = {
  habitacion: null,
  estanteria: 'Los libros de lomo dorado guardan mis proyectos. Elige uno.',
  escritorio: 'Alguien estuvo escribiendo aquí hace poco… lee el pergamino.',
}

const vistas = [
  ['habitacion', 'La habitación'],
  ['estanteria', 'La estantería'],
  ['escritorio', 'El escritorio'],
]

function Tooltip() {
  const hover = useStore((s) => s.hover)
  const ref = useRef()
  useEffect(() => {
    const mover = (e) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`
    }
    window.addEventListener('pointermove', mover)
    return () => window.removeEventListener('pointermove', mover)
  }, [])
  return (
    <div ref={ref} className={`tooltip ${hover ? 'visible' : ''}`} aria-hidden="true">
      {hover}
    </div>
  )
}

function IconoSonido({ activo }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {activo ? (
        <>
          <path d="M16 9a4 4 0 0 1 0 6" />
          <path d="M18.5 6.5a8 8 0 0 1 0 11" />
        </>
      ) : (
        <path d="M16 9l5 6M21 9l-5 6" />
      )}
    </svg>
  )
}

export default function Interfaz() {
  const { vista, entrado, sonido, irA, toggleSonido, toggleIndice, libroAbierto, cartaAbierta, indiceAbierto } = useStore()
  const hayModal = libroAbierto || cartaAbierta || indiceAbierto

  useEffect(() => {
    setSonido(entrado && sonido)
  }, [entrado, sonido])

  useEffect(() => {
    const tecla = (e) => {
      if (e.key !== 'Escape') return
      const s = useStore.getState()
      if (s.libroAbierto) s.cerrarLibro()
      else if (s.cartaAbierta) s.cerrarCarta()
      else if (s.indiceAbierto) s.toggleIndice()
      else if (s.vista !== 'habitacion') s.irA('habitacion')
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])

  if (!entrado) return null

  return (
    <div className={`interfaz ${hayModal ? 'atenuada' : ''}`}>
      <header className="cabecera">
        <h1>{perfil.nombre}</h1>
        <p>{perfil.titulo}</p>
      </header>

      <div className="acciones">
        <button onClick={toggleIndice} className="boton-icono" aria-label="Índice de proyectos">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M4 5h4v14H4zM10 5h4v14h-4zM16 6l3.5-1 3 13.5-3.5 1z" />
          </svg>
          <span>Índice</span>
        </button>
        <button onClick={toggleSonido} className="boton-icono" aria-label={sonido ? 'Silenciar la lluvia' : 'Escuchar la lluvia'}>
          <IconoSonido activo={sonido} />
        </button>
      </div>

      <footer className="pie">
        {pistas[vista] && (
          <p className="pista" key={vista}>
            {pistas[vista]}
          </p>
        )}
        <nav className="navegacion">
          {vistas.map(([id, nombre]) => (
            <button key={id} className={vista === id ? 'activa' : ''} onClick={() => irA(id)}>
              {nombre}
            </button>
          ))}
        </nav>
      </footer>
      <Tooltip />
    </div>
  )
}
