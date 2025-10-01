import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from 'fs'

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
          console.log('✅ Copied standalone background script to dist/background.js');
        }
      }
    },
    // Plugin to remove CDN URLs from jsPDF for Manifest V3 compliance
    {
      name: 'remove-cdn-urls',
      writeBundle() {
        console.log('🔍 Scanning for CDN URLs in bundled files...');
        const distAssetsPath = 'dist/assets';
        
        if (!existsSync(distAssetsPath)) {
          return;
        }

        const files = readdirSync(distAssetsPath);
        let foundAndRemoved = false;

        files.forEach(file => {
          if (file.endsWith('.js')) {
            const filePath = `${distAssetsPath}/${file}`;
            let content = readFileSync(filePath, 'utf-8');
            
            // Check if file contains the CDN URL
            if (content.includes('cdnjs.cloudflare.com')) {
              console.log(`⚠️  Found CDN URL in: ${file}`);
              
              // Replace the pdfobjectnewwindow case to return undefined instead of loading external script
              content = content.replace(
                /case"pdfobjectnewwindow":if\(Object\.prototype\.toString\.call\([^)]+\)==="\[object Window\]"\)\{var [A-Za-z]="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/pdfobject\/[^"]+"/g,
                'case"pdfobjectnewwindow":if(false){var Z="'
              );
              
              // Also remove any other cdnjs.cloudflare.com references
              content = content.replace(/https:\/\/cdnjs\.cloudflare\.com[^"']*/g, '');
              
              writeFileSync(filePath, content, 'utf-8');
              console.log(`✅ Removed CDN URLs from: ${file}`);
              foundAndRemoved = true;
            }
          }
        });

        if (foundAndRemoved) {
          console.log('✅ All CDN URLs removed - Manifest V3 compliant!');
        } else {
          console.log('✅ No CDN URLs found - already compliant!');
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
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
