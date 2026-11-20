import { perfil } from '../data/perfil'
import { useStore } from '../store'
import { Filigrana } from './Adorno'

export default function Carta() {
  const abierta = useStore((s) => s.cartaAbierta)
  const cerrar = useStore((s) => s.cerrarCarta)
  if (!abierta) return null
  const { carta } = perfil
  return (
    <div className="velo" onClick={cerrar} role="dialog" aria-modal="true" aria-label="Carta">
      <article className="carta" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={cerrar} aria-label="Cerrar">
          ✕
        </button>
        <p className="saludo">{carta.saludo}</p>
        {carta.parrafos.map((t, k) => (
          <p key={k}>{t}</p>
        ))}
        <p className="despedida">{carta.despedida}</p>
        <p className="firma">{perfil.nombre}</p>
        <Filigrana />
        <div className="contactos">
          {perfil.contacto.map((c) => (
            <a key={c.etiqueta} href={c.url} target="_blank" rel="noreferrer" className="lacre">
              {c.etiqueta}
            </a>
          ))}
        </div>
      </article>
    </div>
  )
}
