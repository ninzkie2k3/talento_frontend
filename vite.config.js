import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',// Allows external devices to connect
    port: 5173, // Make sure this is not blocked by firewall
    proxy: {
      '/api': {
        target: 'https://palegoldenrod-weasel-648342.hostingersite.com', // This should endpoint of the laravel on the hostinger
        // target: 'https://palegoldenrod-weasel-648342.hostingersite.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

