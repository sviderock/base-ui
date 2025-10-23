'use client';
import type { JSX } from 'solid-js';
import { useContext } from 'solid-js';
import { DemoContext } from './DemoContext';

export function DemoPlayground(props: DemoPlayground.Props) {
  const demoContext = useContext(DemoContext);
  if (!demoContext) {
    throw new Error('Demo.Playground must be used within a Demo.Root');
  }

  const { selectedVariant } = demoContext;

  const DemoComponent = () => selectedVariant().component({});

  return (
    <div {...props}>
      <DemoComponent />
    </div>
  );
}

export namespace DemoPlayground {
  export interface Props extends JSX.HTMLAttributes<HTMLDivElement> {}
}
