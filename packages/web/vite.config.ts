import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import { run as runCssDts } from 'typed-css-modules';
import react from '@vitejs/plugin-react';
import createSvgSpritePlugin from 'vite-plugin-svg-sprite';
import { execa } from 'execa';

const isDev = process.env.NODE_ENV === 'development';
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const srcDir = path.resolve(rootDir, 'src');

runCssDts(srcDir, {
  pattern: '**/*.module.scss',
  watch: isDev,
}).catch(console.error);

if (isDev) {
  void execa('cargo', ['run', '--', '-p', '10221'], {
    stdio: 'inherit',
    cwd: path.resolve(rootDir, '../cli'),
    env: {
      RUST_LOG: process.env.RUST_LOG ?? 'info',
    },
  });
}

// https://vitejs.dev/config/
export default defineConfig({
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
  server: {
    port: 10222,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:10221',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://127.0.0.1:10221',
        changeOrigin: true,
        ws: true,
      },
    },

  },
});
