import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (command === 'build' && !env.VITE_API_BASE_URL?.trim()) {
    throw new Error('VITE_API_BASE_URL is required for production builds. Set it before running the build.')
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
    },
  }
})
