import { CompileOptions } from '@mdx-js/mdx';
import { defineConfig } from '@solidjs/start/config';
import rehypeExtractToc from '@stefanprobst/rehype-extract-toc';
import pkg from '@vinxi/plugin-mdx';
import remarkGfm from 'remark-gfm';
import remarkTypography from 'remark-typography';
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
const config = defineConfig({
  solid: {
    extensions: ['mdx', 'md', 'tsx'],
    ssr: true,
  },
  extensions: ['mdx', 'md', 'tsx'],
  vite: {
    plugins: [
      tsconfigPaths(),
      mdx.withImports({})({
        jsx: true,
        jsxImportSource: 'solid-js',
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
      solid({
        extensions: ['mdx', 'md', 'tsx'],
        ssr: true,
      }),
    ],
  },
});

export default config;
