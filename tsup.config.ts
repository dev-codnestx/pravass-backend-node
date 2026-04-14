import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  target: 'node20',
  format: ['esm'],
  sourcemap: true,
  clean: true,
  splitting: false,
  bundle: true,
  external: ['tsconfig-paths', 'path', 'ioredis', 'events', 'puppeteer'],
});
