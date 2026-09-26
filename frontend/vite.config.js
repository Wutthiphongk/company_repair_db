import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true, // ช่วยให้ระบบตรวจจับการเปลี่ยนแปลงไฟล์ได้ดีขึ้น
    },
  },
})
