import { createAsync, query } from '@solidjs/router';
import { createMemo, Show, splitProps, Suspense, type ComponentProps } from 'solid-js';
import { Demo } from './Demo';
import { loadDemo } from './loadDemo';

const getVariants = query(async (path: string) => {
  'use server';
  const variants = await loadDemo(path);

  if (!variants.length) {
    throw new Error(`\nCould not load demo: no demos found in "${path}".`);
  }

  return variants;
}, 'components-metadata');

export interface DemoLoaderProps extends Omit<ComponentProps<typeof Demo>, 'variants'> {
  /** Absolute path to a folder with demos or to a .tsx file with the main demo */
  path: string;
  /** Modules that are imported into the current scope in order to render the demo */
  scope: Record<string, any>;
}

export function DemoLoader(componentProps: DemoLoaderProps) {
  const [local, props] = splitProps(componentProps, ['path', 'scope']);
  const variants = createAsync(() => getVariants(local.path));

  const variantsWithComponents = createMemo(() => {
    return variants()?.map((variant) => {
      return {
        ...variant,
        component: local.scope[variant.component],
      };
    });
  });

  return (
    <Suspense>
      <Show when={variantsWithComponents()?.length}>
        <Demo variants={variantsWithComponents()!} {...props} />
      </Show>
    </Suspense>
  );
}
