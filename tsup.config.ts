import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'TSUP config',
  entry: ['./src/index.ts'],
  target: 'es2020',
  minify: true,
  outDir: 'dist/lib',
  tsconfig: 'tsconfig.json',
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  splitting: false,
  clean: true,
})
