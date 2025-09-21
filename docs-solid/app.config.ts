import { defineConfig } from '@solidjs/start/config';
import pkg from '@vinxi/plugin-mdx';
import tsconfigPaths from 'vite-tsconfig-paths';

const { default: mdx } = pkg;
export default defineConfig({
  solid: {
    extensions: ['mdx', 'tsx'],
  },
  extensions: ['mdx', 'tsx'],
  vite: {
    plugins: [
      tsconfigPaths(),
      mdx.withImports({})({
        jsx: true,
        jsxImportSource: 'solid-js',
        providerImportSource: 'solid-mdx',
      }),
    ],
  },
});
