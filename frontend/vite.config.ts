import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // The prerender pass (src/entry-server.tsx) is a Node build for the build
    // machine only — vendor chunk splitting is a browser concern, so leave it
    // off there.
    rollupOptions: isSsrBuild
      ? {}
      : {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom', 'react-router-dom'],
              supabase: ['@supabase/supabase-js'],
            },
          },
        },
  },
}))
