import { clientOnly } from '@solidjs/start';
import type { JSX } from 'solid-js';
import { createMemo, lazy, Suspense, useContext } from 'solid-js';
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

  const { selectedVariant } = demoContext;

  const Comp = createMemo(() =>
    lazy(() => import(/* @vite-ignore */ selectedVariant().componentPath)),
  );

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
