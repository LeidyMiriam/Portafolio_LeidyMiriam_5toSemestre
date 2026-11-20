import { useEffect } from 'react'
import { proyectos } from '../data/proyectos'
import { useStore } from '../store'
import Adorno, { Filigrana } from './Adorno'

// Rutas de /public relativas a la base (necesario para GitHub Pages)
const ruta = (u) => (u && u.startsWith('/') ? import.meta.env.BASE_URL + u.slice(1) : u)

const romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']

export default function LibroAbierto() {
  const id = useStore((s) => s.libroAbierto)
  const cerrar = useStore((s) => s.cerrarLibro)
  const abrir = useStore((s) => s.abrirLibro)
  const i = proyectos.findIndex((p) => p.id === id)
  const p = proyectos[i]

  useEffect(() => {
    if (!p) return
    const tecla = (e) => {
      if (e.key === 'ArrowRight' && i < proyectos.length - 1) abrir(proyectos[i + 1].id)
      if (e.key === 'ArrowLeft' && i > 0) abrir(proyectos[i - 1].id)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [p, i, abrir])

  if (!p) return null

  return (
    <div className="velo" onClick={cerrar} role="dialog" aria-modal="true" aria-label={p.titulo}>
      <div className="libro-abierto" key={p.id} style={{ '--cuero': p.color }} onClick={(e) => e.stopPropagation()}>
        {/* página derecha (fija) */}
        <section className="pagina pagina-der">
          <div className="contenido-pagina">
            <p className="etiqueta">{p.fecha}</p>
            {p.descripcion.map((parrafo, k) => (
              <p key={k} className={k === 0 ? 'capitular' : ''}>
                {parrafo}
              </p>
            ))}
            <Filigrana />
            <h3 className="subtitulo-pagina">Hechizos empleados</h3>
            <ul className="tecnologias">
              {p.tecnologias.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {p.repo && (
              <div className="enlaces">
                {p.repo && (
                  <a href={p.repo} target="_blank" rel="noreferrer" className="sello sello-sec">
                    Leer el código
                  </a>
                )}
              </div>
            )}
          </div>
          <span className="folio">{2 * i + 2}</span>
        </section>

        {/* la tapa gira sobre el lomo; su dorso es la página izquierda */}
        <div className="tapa">
          <div className="cara frente">
            <div className="marco-tapa">
              <Adorno tipo={p.adorno} tamano={54} className="adorno-tapa" />
              <h2>{p.titulo}</h2>
              <p>{p.subtitulo}</p>
            </div>
          </div>
          <section className="cara dorso pagina pagina-izq">
            <div className="contenido-pagina">
              <p className="capitulo">Capítulo {romanos[i] ?? i + 1}</p>
              <Adorno tipo={p.adorno} tamano={30} className="adorno-pagina" />
              <h2 className="titulo-libro">{p.titulo}</h2>
              <p className="subtitulo-libro">{p.subtitulo}</p>
              <Filigrana />
              {p.demo && p.previa !== false ? (
                <div className="ilustracion vista-previa">
                  <iframe src={ruta(p.demo)} title={`Vista previa de ${p.titulo}`} loading="lazy" />
                </div>
              ) : p.imagen ? (
                <img className="ilustracion" src={ruta(p.imagen)} alt={`Captura de ${p.titulo}`} />
              ) : (
                <div className="ilustracion vacia">
                  <span>Aquí irá una ilustración del proyecto</span>
                </div>
              )}
              {p.demo && (
                <a className="sello boton-abrir" href={ruta(p.demo)} target="_blank" rel="noreferrer">
                  Abrir en otra pestaña ↗
                </a>
              )}
              {p.nota && <p className="nota">{p.nota}</p>}
            </div>
            <span className="folio">{2 * i + 1}</span>
          </section>
        </div>
      </div>

      <nav className="controles-libro" onClick={(e) => e.stopPropagation()}>
        <button disabled={i === 0} onClick={() => abrir(proyectos[i - 1].id)} aria-label="Proyecto anterior">
          ‹ Anterior
        </button>
        <button onClick={cerrar} className="cerrar">
          Devolver al estante
        </button>
        <button
          disabled={i === proyectos.length - 1}
          onClick={() => abrir(proyectos[i + 1].id)}
          aria-label="Proyecto siguiente"
        >
          Siguiente ›
        </button>
      </nav>
    </div>
  )
}
