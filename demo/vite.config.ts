import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import reactWorker from 'vite-plugin-react-worker'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), reactWorker()],
})
