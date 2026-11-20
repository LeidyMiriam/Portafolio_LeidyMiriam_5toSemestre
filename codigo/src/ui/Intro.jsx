import { useState } from 'react'
import { perfil } from '../data/perfil'
import { useStore } from '../store'
import { iniciarAudio } from '../audio/ambiente'
import { Filigrana } from './Adorno'

export default function Intro({ listo }) {
  const entrado = useStore((s) => s.entrado)
  const entrar = useStore((s) => s.entrar)
  const [oculto, setOculto] = useState(false)
  if (oculto) return null
  return (
    <div className={`intro ${entrado ? 'saliendo' : ''}`} onTransitionEnd={() => entrado && setOculto(true)}>
      <div className="intro-contenido">
        <p className="intro-pre">Una noche de tormenta</p>
        <h1>{perfil.nombre}</h1>
        <Filigrana />
        <p className="intro-sub">{perfil.subtitulo}</p>
        {listo ? (
          <button
            className="boton-entrar"
            onClick={() => {
              iniciarAudio()
              entrar()
            }}
          >
            Entrar a la biblioteca
          </button>
        ) : (
          <p className="cargando">Encendiendo las velas…</p>
        )}
        <p className="intro-nota">Con sonido de lluvia · puedes silenciarlo después</p>
      </div>
    </div>
  )
}
