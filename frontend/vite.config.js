import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
   proxy: {
      // everything under /auth will be forwarded to backend
      '/auth': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      }
    }
})
