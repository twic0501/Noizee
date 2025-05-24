// vite.config.js (trong thư mục gốc của noizee-user-frontend)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // Hoặc @vitejs/plugin-react

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, 
    open: true, 
    proxy: {
      '/api/uploads': { 
        target: 'http://localhost:5000', 
        changeOrigin: true, 
      },
    }
  },
  build: {
    outDir: 'dist', 
    sourcemap: true, 
  },
  assetsInclude: ['**/*.glb', '**/*.png'], // This is correct
});