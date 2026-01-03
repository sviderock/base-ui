import { evaluate, EvaluateOptions } from '@mdx-js/mdx';
import type { MDXModule } from 'mdx/types';
import { createMemo, createSignal, onMount } from 'solid-js';
import * as jsxRuntime from 'solid-js/h/jsx-runtime';

export function createMdxComponent(
  markdown: string = '',
  options: Partial<Record<keyof EvaluateOptions, unknown>>,
) {
  const [mdxModule, setMdxModule] = createSignal<MDXModule>();
  const Content = createMemo(() => mdxModule()?.default ?? null);

  async function compileComponent() {
    const Comp = await evaluate(markdown, {
      elementAttributeNameCase: 'html',
      stylePropertyNameCase: 'css',
      ...jsxRuntime,
      ...options,
    } as EvaluateOptions);

    setMdxModule(Comp);
  }

  onMount(() => {
    compileComponent();
  });

  return <>{Content()}</>;
}
