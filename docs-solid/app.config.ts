import { CompileOptions } from '@mdx-js/mdx';
import { defineConfig } from '@solidjs/start/config';
import rehypeExtractToc from '@stefanprobst/rehype-extract-toc';
import pkg from '@vinxi/plugin-mdx';
import { readFileSync } from 'fs';
import path from 'path';
import remarkGfm from 'remark-gfm';
import remarkTypography from 'remark-typography';
import { fileURLToPath } from 'url';
import solid from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';
import { rehypeDemos } from './src/components/Demo/rehypeDemos.mjs';
import { rehypeKbd } from './src/components/Kbd/rehypeKbd.mjs';
import { rehypeChangelog } from './src/components/QuickNav/rehypeChangelog.mjs';
import { rehypeQuickNav } from './src/components/QuickNav/rehypeQuickNav.mjs';
import { rehypeSlug } from './src/components/QuickNav/rehypeSlug.mjs';
import { rehypeReference } from './src/components/ReferenceTable/rehypeReference.mjs';
import { rehypeSubtitle } from './src/components/Subtitle/rehypeSubtitle.mjs';
import { rehypeSyntaxHighlighting } from './src/syntax-highlighting/index.mjs';

const { default: mdx } = pkg;
const currentDirectory = fileURLToPath(new URL('.', import.meta.url));
const workspaceRoot = path.resolve(currentDirectory, '../');

const rootPackage = loadPackageJson();

const config = defineConfig({
  solid: {
    extensions: ['mdx', 'md', 'tsx'],
    ssr: true,
  },
  extensions: ['mdx', 'md', 'tsx'],
  server: {
    esbuild: {
      options: {
        supported: {
          'top-level-await': true,
        },
      },
    },
  },
  vite: {
    define: {
      'process.env.LIB_VERSION': JSON.stringify(rootPackage.version),
    },
    plugins: [
      tsconfigPaths(),
      mdx.withImports({})({
        jsx: true,
        jsxImportSource: 'solid-js/h',
        providerImportSource: 'solid-mdx',
        remarkPlugins: [remarkGfm, remarkTypography],
        elementAttributeNameCase: 'html',
        stylePropertyNameCase: 'css',
        rehypePlugins: [
          rehypeDemos,
          rehypeReference,
          ...rehypeSyntaxHighlighting,
          rehypeSlug,
          rehypeChangelog,
          rehypeExtractToc,
          rehypeQuickNav,
          rehypeSubtitle,
          rehypeKbd,
        ],
      } satisfies CompileOptions),
    ],
  },
});

/**
 * @returns {{version: string}}
 */
function loadPackageJson() {
  const pkgContent = readFileSync(path.resolve(workspaceRoot, 'package.json'), 'utf8');
  return JSON.parse(pkgContent);
}

export default config;
