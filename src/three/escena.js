import * as THREE from 'three'

// Distribución general de la habitación (unidades ≈ metros)
export const HAB = {
  ancho: 10, // x de -5 a 5
  alto: 5.4,
  fondoZ: -4, // pared trasera
  frenteZ: 7,
}

export const VENTANA = {
  x: -1.5,
  base: 1.3, // altura del alféizar
  ancho: 1.5,
  altoRecto: 1.45, // parte rectangular antes del arco
  altoArco: 0.95,
}

export const ESCRITORIO = { x: -1.4, z: -3.12, alto: 0.95, ancho: 2.3, fondo: 1.05 }
export const ESTANTE = { x: 2.55, z: -3.74, ancho: 2.5, alto: 4.5, fondo: 0.46 }

// Vistas de cámara: posición y punto al que mira
export const VISTAS = {
  habitacion: { pos: [0.35, 2.35, 2.7], mira: [0.4, 1.85, -3] },
  estanteria: { pos: [ESTANTE.x, 3.2, -1.3], mira: [ESTANTE.x, 3.35, -3.7] },
  escritorio: { pos: [ESCRITORIO.x + 0.08, 1.9, -1.8], mira: [ESCRITORIO.x, 0.95, -3.2] },
}

// Contorno del arco gótico apuntado (ojival) de la ventana, en coordenadas locales
// (origen en el centro inferior). Sirve tanto para el hueco de la pared como para el vidrio.
export function contornoOjival(ancho, altoRecto, altoArco, margen = 0) {
  const w = ancho / 2 + margen
  const h = altoRecto
  const a = altoArco + margen * 0.6
  // Cada lado es un arco de radio r con centro en el lado opuesto: se encuentran en punta.
  const r = (a * a + w * w) / (2 * w)
  const angMax = Math.asin(a / r)
  const n = 24
  const pts = []
  pts.push(new THREE.Vector2(-w, -margen))
  pts.push(new THREE.Vector2(w, -margen))
  for (let i = 0; i <= n; i++) {
    const ang = (i / n) * angMax
    pts.push(new THREE.Vector2(w - r + r * Math.cos(ang), h + r * Math.sin(ang)))
  }
  for (let i = n - 1; i >= 0; i--) {
    const ang = (i / n) * angMax
    pts.push(new THREE.Vector2(-(w - r + r * Math.cos(ang)), h + r * Math.sin(ang)))
  }
  return pts
}
