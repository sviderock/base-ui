import { compile, CompileOptions, run, type UseMdxComponents } from '@mdx-js/mdx';
import { clientOnly } from '@solidjs/start';
import type { MDXModule } from 'mdx/types';
import { createMemo, createSignal, onMount, splitProps } from 'solid-js';
import * as jsxRuntime from 'solid-js/h/jsx-runtime';

async function createMdxComponent(
  markdown = '',
  // Real CompileOptions types are really stingy and hard to use, so just the keys are enough for our purposes
  options: Partial<Record<keyof CompileOptions, unknown>> = {},
) {
  return String(
    await compile(markdown, { outputFormat: 'function-body', ...(options as CompileOptions) }),
  );
}

export const AsyncMDXComponent = clientOnly(async () => ({
  default: (props: {
    markdown: string | undefined;
    options: Partial<Record<keyof CompileOptions, unknown>> & { useMDXComponents?: any };
  }) => {
    const [local, rest] = splitProps(props.options, ['useMDXComponents']);
    const [mdxModule, setMdxModule] = createSignal<MDXModule>();
    const Content = createMemo(() => mdxModule()?.default ?? (() => <></>));

    onMount(() => {
      createMdxComponent(props.markdown ?? '', rest).then(async (code) => {
        const compiledComponent = await run(code, {
          ...jsxRuntime,
          baseUrl: import.meta.url,
          useMDXComponents: (() => local.useMDXComponents) as UseMdxComponents,
        });

        setMdxModule(compiledComponent);
      });
    });

    return <>{Content()}</>;
  },
}));
