import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // rutas relativas: funciona en GitHub Pages (usuario.github.io/portafolio/)
  base: './',
  plugins: [react()],
})
