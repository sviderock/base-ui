import { clientOnly } from '@solidjs/start';
import { createMemo, lazy, on, Suspense, useContext, type Component, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { DemoContext } from './DemoContext';

export const DemoPlayground = clientOnly(async () => ({ default: _DemoPlayground }), {
  lazy: true,
});

function _DemoPlayground(props: DemoPlayground.Props) {
  const demoContext = useContext(DemoContext);
  if (!demoContext) {
    throw new Error('Demo.Playground must be used within a Demo.Root');
  }

  const { variants, selectedVariant } = demoContext;
  const variantComponents = createMemo(() => {
    const components: Record<string, Component> = {};
    for (const variant of variants()) {
      components[variant.name] = lazy(() => import(/* @vite-ignore */ variant.componentPath));
    }
    return components;
  });

  const Comp = createMemo(() => variantComponents()[selectedVariant().name]);

  return (
    <div {...props}>
      <Suspense>
        <Dynamic component={Comp()} />
      </Suspense>
    </div>
  );
}

export namespace DemoPlayground {
  export interface Props extends JSX.HTMLAttributes<HTMLDivElement> {}
}
