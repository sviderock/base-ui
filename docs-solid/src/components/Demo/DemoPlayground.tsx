import * as BaseDemo from 'docs-solid/src/blocks/Demo';
import { useDemoContext } from 'docs-solid/src/blocks/Demo/DemoContext';
import { ErrorBoundary } from 'solid-js';
import { DemoErrorFallback } from './DemoErrorFallback';

export function DemoPlayground() {
  const { selectedVariant } = useDemoContext();

  return (
    <ErrorBoundary fallback={DemoErrorFallback}>
      <div class="DemoPlayground">
        <BaseDemo.Playground
          aria-label="Component demo"
          data-demo={selectedVariant().name}
          class="DemoPlaygroundInner"
        />
      </div>
    </ErrorBoundary>
  );
}
