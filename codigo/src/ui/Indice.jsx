import { proyectos } from '../data/proyectos'
import { useStore } from '../store'
import Adorno, { Filigrana } from './Adorno'

// Lista accesible de todos los proyectos (también útil en celulares)
export default function Indice() {
  const abierto = useStore((s) => s.indiceAbierto)
  const toggle = useStore((s) => s.toggleIndice)
  const abrir = useStore((s) => s.abrirLibro)
  if (!abierto) return null
  return (
    <div className="velo" onClick={toggle} role="dialog" aria-modal="true" aria-label="Índice">
      <article className="indice" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={toggle} aria-label="Cerrar">
          ✕
        </button>
        <h2>Índice</h2>
        <Filigrana />
        <ol>
          {proyectos.map((p) => (
            <li key={p.id}>
              <button onClick={() => abrir(p.id)}>
                <Adorno tipo={p.adorno} tamano={18} />
                <span className="titulo">{p.titulo}</span>
                <span className="puntos" />
                <span className="fecha">{p.fecha}</span>
              </button>
            </li>
          ))}
        </ol>
      </article>
    </div>
  )
}
