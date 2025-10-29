import { evaluate, EvaluateOptions } from '@mdx-js/mdx';
import * as jsxRuntime from 'solid-js/h/jsx-runtime';

export async function createMdxComponent(
  markdown = '',
  // Real EvaluateOptions types are really stingy and hard to use, so just the keys are enough for our purposes
  options: Partial<Record<keyof EvaluateOptions, unknown>> = {},
) {
  const { default: Component } = await evaluate(markdown, {
    elementAttributeNameCase: 'html',
    stylePropertyNameCase: 'css',
    ...jsxRuntime,
    ...options,
  } as EvaluateOptions);
  return Component;
}
