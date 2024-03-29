import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import createSvgSpritePlugin from 'vite-plugin-svg-sprite';
import { internalIpV4 } from 'internal-ip';
import { fileURLToPath } from 'url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const srcDir = path.resolve(rootDir, 'src');

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const host = await internalIpV4();

  return {
    resolve: {
      alias: {
        '#': srcDir,
      },
    },
    plugins: [
      react(),
      createSvgSpritePlugin({
        symbolId: 'icon-[name]-[hash]',
      }),
    ],

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    // prevent vite from obscuring rust errors
    clearScreen: false,
    // tauri expects a fixed port, fail if that port is not available
    server: {
      host: '0.0.0.0', // listen on all addresses
      port: 1420,
      strictPort: true,
      hmr: {
        protocol: 'ws',
        host,
        port: 5183,
      },
    },
    // to make use of `TAURI_DEBUG` and other env variables
    // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
    envPrefix: ['VITE_', 'TAURI_'],
    build: {
    // Tauri supports es2021
      target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome90' : 'safari13',
      // don't minify for debug builds
      minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
      // produce sourcemaps for debug builds
      sourcemap: !!process.env.TAURI_DEBUG,
    },
  };
});
