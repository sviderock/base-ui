import { createAsync } from '@solidjs/router';
import { clientOnly } from '@solidjs/start';
import { Show, splitProps, Suspense, type ComponentProps } from 'solid-js';
import type { DemoVariant } from '../../blocks/Demo';
import { Demo } from './Demo';
import { loadDemo } from './loadDemo';

export interface DemoLoaderProps extends ComponentProps<typeof Demo> {
  /** Absolute path to a folder with demos or to a .tsx file with the main demo */
  path: string;
}

export const DemoLoader = clientOnly(async () => ({ default: _DemoLoader }), { lazy: true });

function _DemoLoader(componentProps: DemoLoaderProps) {
  const [local, props] = splitProps(componentProps, ['path', 'variants']);
  const variants = createAsync(async () => {
    const result = await loadDemo(local.path);
    if (!result.length) {
      throw new Error(`\nCould not load demo: no demos found in "${local.path}".`);
    }
    return result;
  });

  return (
    <Suspense>
      <Show when={variants()?.length}>
        <Demo variants={variants() as DemoVariant[]} {...props} />
      </Show>
    </Suspense>
  );
}
