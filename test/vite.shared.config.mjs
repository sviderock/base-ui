import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  mode: process.env.NODE_ENV || 'development',
  plugins: [react()],
  resolve: {
    alias: {
      '@base-ui-components/react': path.join(process.cwd(), 'packages/react/src'),
      './fonts': path.join(process.cwd(), '/docs/src/fonts'),
      '@base-ui-components/solid': path.join(process.cwd(), 'packages/solid/src'),
      docs: path.join(process.cwd(), '/docs'),
      'docs-solid': path.join(process.cwd(), '/docs-solid'),
      stream: null,
      zlib: null,
    },
  },
  build: { outDir: 'build', chunkSizeWarningLimit: 9999 },
});
