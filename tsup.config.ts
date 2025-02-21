import { defineConfig } from 'tsup';

export default defineConfig({
  name: 'TSUP config',
  // Ignore spec files
  // https://github.com/egoist/tsup/issues/986#issuecomment-1927797098
  entry: ['src/**/*.ts', '!src/**/*.spec.ts'],
  target: 'es2020',
  minify: true,
  outDir: 'dist/lib',
  tsconfig: 'tsconfig.json',
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  splitting: false,
  clean: true,
});
