import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? 'dev') },
  base: '/yoga-class-builder/',
  build: { chunkSizeWarningLimit: 1200 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'クラスビルダー',
        short_name: 'クラスビルダー',
        description: 'ヨガ・ピラティスのクラスメニューを組み立てる自分専用アプリ',
        lang: 'ja',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#F4F5EF',
        theme_color: '#5F8466',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 同じ github.io オリジンの他アプリと混ざらないよう専用の接頭辞にする
        cacheId: 'yoga-class',
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
});
