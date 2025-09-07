import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      // Vue プラグインの設定
      reactivityTransform: true,
      template: {
        compilerOptions: {
          // カスタムエレメントの設定
          isCustomElement: (tag) => tag.startsWith('custom-')
        }
      }
    })
  ],
  
  // 開発サーバーの設定
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      // API プロキシ設定
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  
  // ビルド設定
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['vue'],
          utils: ['./src/services/taskService.js']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: true
  },
  
  // パス解決の設定
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  
  // CSS の設定
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  // 環境変数の設定
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },
  
  // 最適化設定
  optimizeDeps: {
    include: ['vue'],
    exclude: ['@vueuse/core']
  },
  
  // プレビューサーバーの設定（本番ビルドのプレビュー用）
  preview: {
    host: '0.0.0.0',
    port: 4173,
    open: true
  },
  
  // ESBuild の設定
  esbuild: {
    drop: ['console', 'debugger']
  },
  
  // PWA 設定（将来的な拡張のため）
  // PWA プラグインを使用する場合
  // pwa: {
  //   registerType: 'autoUpdate',
  //   workbox: {
  //     globPatterns: ['**/*.{js,css,html,ico,png,svg}']
  //   },
  //   manifest: {
  //     name: 'TODO アプリ',
  //     short_name: 'TODO',
  //     description: 'シンプルで効率的なタスク管理アプリケーション',
  //     theme_color: '#4299e1',
  //     background_color: '#ffffff',
  //     display: 'standalone',
  //     orientation: 'portrait',
  //     scope: '/',
  //     start_url: '/',
  //     icons: [
  //       {
  //         src: 'pwa-192x192.png',
  //         sizes: '192x192',
  //         type: 'image/png'
  //       },
  //       {
  //         src: 'pwa-512x512.png',
  //         sizes: '512x512',
  //         type: 'image/png'
  //       }
  //     ]
  //   }
  // }
})
