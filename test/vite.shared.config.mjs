import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig } from 'vite';

const shouldDisableWorkspaceAliases = Boolean(process.env.MUI_DISABLE_WORKSPACE_ALIASES);

export default defineConfig({
  mode: process.env.NODE_ENV || 'development',
  plugins: [react()],
  resolve: {
    alias: {
      ...(shouldDisableWorkspaceAliases
        ? undefined
        : {
            '@base-ui/react': path.join(process.cwd(), 'packages/react/src'),
            '@base-ui/utils': path.join(process.cwd(), 'packages/utils/src'),
          }),
      './fonts': path.join(process.cwd(), '/docs/src/fonts'),
      '@msviderok/base-ui-solid': path.join(process.cwd(), 'packages/solid/src'),
      docs: path.join(process.cwd(), '/docs'),
      'docs-solid': path.join(process.cwd(), '/docs-solid'),
      stream: null,
      zlib: null,
    },
  },
  build: { outDir: 'build', chunkSizeWarningLimit: 9999 },
});
