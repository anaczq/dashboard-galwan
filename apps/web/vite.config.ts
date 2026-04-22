import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '.'), '')
  const siteUrl = env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? ''
  const ogImageUrl = siteUrl ? `${siteUrl}/galwan-icon.png` : '/galwan-icon.png'

  return {
    plugins: [
      react(),
      {
        name: 'inject-og-image',
        transformIndexHtml(html) {
          return html.replaceAll('__OG_IMAGE_URL__', ogImageUrl)
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
