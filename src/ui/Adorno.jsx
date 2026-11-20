// Pequeños emblemas dorados que acompañan a cada libro
const trazos = {
  luna: <path d="M15 3a9 9 0 1 0 6 15.7A10 10 0 0 1 15 3z" />,
  rosa: (
    <>
      <path d="M12 3c3 0 5 2 5 4.5S15 12 12 12 7 10 7 7.5 9 3 12 3z" />
      <path d="M12 12c-3.5 0-6.5-1.5-7.5-4C4 11 6.5 15 12 15s8-4 7.5-7c-1 2.5-4 4-7.5 4z" />
      <path d="M12 15v6M12 18c-2 0-3-1-3.5-2M12 19c2 0 3-1 3.5-2" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </>
  ),
  llave: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="6" r="3.5" />
      <path d="M12 9.5V21M12 16h3M12 19h2.5" />
    </g>
  ),
  cuervo: <path d="M3 14c3-5 7-8 11-5 1.5-1.5 4-2 6-1l-2.5 1.5c.8 3-1.2 6-5 6.5L9 20l.7-3.8C7 16.5 5 16 3 14z" />,
  estrella: <path d="M12 2l2.6 6.9 7.4.3-5.8 4.6 2 7.2L12 16.9 5.8 21l2-7.2L2 9.2l7.4-.3z" />,
  corazon: <path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z" />,
}

export default function Adorno({ tipo = 'estrella', tamano = 28, className = '' }) {
  return (
    <svg
      className={className}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {trazos[tipo] ?? trazos.estrella}
    </svg>
  )
}

// Filigrana separadora
export function Filigrana({ className = '' }) {
  return (
    <svg className={`filigrana ${className}`} viewBox="0 0 200 16" aria-hidden="true">
      <path
        d="M0 8h70c6 0 8-6 14-6s8 6 16 6 10-6 16-6 8 6 14 6h70"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M100 3l4 5-4 5-4-5z" fill="currentColor" />
    </svg>
  )
}
