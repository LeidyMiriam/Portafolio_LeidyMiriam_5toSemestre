import { create } from 'zustand'

// Vistas de cámara: 'habitacion' | 'estanteria' | 'escritorio'
export const useStore = create((set) => ({
  entrado: false,
  vista: 'habitacion',
  libroAbierto: null, // id del proyecto abierto
  cartaAbierta: false,
  indiceAbierto: false,
  sonido: true,
  hover: null, // texto del tooltip

  entrar: () => set({ entrado: true }),
  irA: (vista) => set({ vista, libroAbierto: null, cartaAbierta: false, indiceAbierto: false }),
  abrirLibro: (id) => set({ libroAbierto: id, vista: 'estanteria', indiceAbierto: false }),
  cerrarLibro: () => set({ libroAbierto: null }),
  abrirCarta: () => set({ cartaAbierta: true, vista: 'escritorio' }),
  cerrarCarta: () => set({ cartaAbierta: false }),
  toggleIndice: () => set((s) => ({ indiceAbierto: !s.indiceAbierto })),
  toggleSonido: () => set((s) => ({ sonido: !s.sonido })),
  setHover: (hover) => set({ hover }),
}))

// Valores que cambian cada frame: se guardan fuera de React para no re-renderizar.
export const tormenta = {
  destello: 0, // 0..1 intensidad del relámpago actual
}
