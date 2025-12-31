import { createAsync } from '@solidjs/router';
import { Show, splitProps, Suspense, type ComponentProps } from 'solid-js';
import { Demo } from './Demo';
import { loadDemo } from './loadDemo';

export interface DemoLoaderProps extends Omit<ComponentProps<typeof Demo>, 'variants'> {
  /** Absolute path to a folder with demos or to a .tsx file with the main demo */
  path: string;
  /** Modules that are imported into the current scope in order to render the demo */
  scope: Record<string, any>;
}

export function DemoLoader(componentProps: DemoLoaderProps) {
  const [local, props] = splitProps(componentProps, ['path', 'scope']);
  const variants = createAsync(async () => {
    const variants = await loadDemo(local.path);
    for (const variant of variants) {
      variant.component = local.scope[variant.component];
    }

    if (!variants.length) {
      throw new Error(`\nCould not load demo: no demos found in "${local.path}".`);
    }

    return variants;
  });

  return (
    <Suspense>
      <Show when={variants()?.length}>
        <Demo variants={variants()!} {...props} />
      </Show>
    </Suspense>
  );
}
