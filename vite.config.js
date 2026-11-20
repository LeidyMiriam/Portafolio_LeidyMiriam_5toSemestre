import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El código fuente vive en /codigo y `npm run build` deja la página
// compilada (index.html, assets/, proyectos/) en la raíz del repo,
// para publicarla en GitHub Pages con "Deploy from a branch" → main / (root).
export default defineConfig({
  root: 'codigo',
  // rutas relativas: funciona en GitHub Pages (usuario.github.io/repo/)
  base: './',
  plugins: [react()],
  build: {
    outDir: '..',
    // NO vaciar la carpeta de salida: es la raíz del repo
    emptyOutDir: false,
  },
})
