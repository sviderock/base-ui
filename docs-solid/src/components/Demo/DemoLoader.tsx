import { createMemo, Show, splitProps, type ComponentProps } from 'solid-js';
import type { DemoVariant } from '../../blocks/Demo';
import { Demo } from './Demo';

export interface DemoLoaderProps extends Omit<ComponentProps<typeof Demo>, 'variants'> {
  /** Absolute path to a folder with demos or to a .tsx file with the main demo */
  path: string;
  /** Modules that are imported into the current scope in order to render the demo */
  scope: Record<string, any>;
  /** Metadata for the demo */
  metadata: string;
}

export function DemoLoader(componentProps: DemoLoaderProps) {
  const [local, props] = splitProps(componentProps, ['scope', 'metadata']);
  const variantsWithComponents = createMemo((): DemoVariant[] | undefined => {
    try {
      const scope = 'default' in local.scope ? local.scope.default : local.scope;
      const metadata = JSON.parse(local.metadata) as DemoVariant[];
      for (const variant of metadata) {
        variant.component = scope[variant.component];
      }
      return metadata;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  });

  return (
    <Show when={variantsWithComponents()?.length}>
      <Demo variants={variantsWithComponents()!} {...props} />
    </Show>
  );
}
