import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    // Plugin to copy manifest.json and icons to dist folder
    {
      name: 'copy-manifest',
      generateBundle() {
        // Copy manifest.json
        if (existsSync('manifest.json')) {
          copyFileSync('manifest.json', 'dist/manifest.json');
        }
        
        // Copy icons folder
        if (existsSync('JOT Snatcher/public/icons')) {
          if (!existsSync('dist/icons')) {
            mkdirSync('dist/icons', { recursive: true });
          }
          const iconFiles = ['spjot-16.png', 'spjot-48.png', 'spjot-128.png'];
          iconFiles.forEach(icon => {
            const srcPath = `JOT Snatcher/public/icons/${icon}`;
            const destPath = `dist/icons/${icon}`;
            if (existsSync(srcPath)) {
              copyFileSync(srcPath, destPath);
            }
          });
        }
        
        // Also try copying from the root icons folder if it exists
        if (existsSync('icons')) {
          if (!existsSync('dist/icons')) {
            mkdirSync('dist/icons', { recursive: true });
          }
          const iconFiles = ['spjot-16.png', 'spjot-48.png', 'spjot-128.png'];
          iconFiles.forEach(icon => {
            const srcPath = `icons/${icon}`;
            const destPath = `dist/icons/${icon}`;
            if (existsSync(srcPath)) {
              copyFileSync(srcPath, destPath);
            }
          });
        }
      }
    },
    // Plugin to copy standalone background script after build
    {
      name: 'copy-background',
      writeBundle() {
        // Copy standalone background script
        if (existsSync('src/background/background-standalone.js')) {
          copyFileSync('src/background/background-standalone.js', 'dist/background.js');
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log statements in production
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      }
    },
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        iframe: resolve(__dirname, 'src/iframe/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        content: resolve(__dirname, 'src/content/content-script.ts'),
        floatingButton: resolve(__dirname, 'src/content/floating-button.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'popup') return 'popup.js'
          if (chunkInfo.name === 'iframe') return 'iframe.js'
          if (chunkInfo.name === 'options') return 'options.js'
          if (chunkInfo.name === 'content') return 'content-script.js'
          if (chunkInfo.name === 'floatingButton') return 'floating-button.js'
          return '[name].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.html')) {
            return '[name].[ext]'
          }
          return 'assets/[name]-[hash].[ext]'
        },
        format: 'es'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
