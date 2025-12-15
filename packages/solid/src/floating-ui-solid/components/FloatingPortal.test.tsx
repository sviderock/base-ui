import { flushMicrotasks, isJSDOM } from '#test-utils';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, onMount } from 'solid-js';

import { FloatingPortal, useFloating } from '../index';

function App(props: { root?: HTMLElement; id?: string }) {
  const [open, setOpen] = createSignal(false);
  const { refs } = useFloating({
    open,
    onOpenChange: setOpen,
  });

  return (
    <>
      <button data-testid="reference" ref={refs.setReference} onClick={() => setOpen((v) => !v)} />
      <FloatingPortal {...props}>
        {open() && <div ref={refs.setFloating} data-testid="floating" />}
      </FloatingPortal>
    </>
  );
}

describe.skipIf(!isJSDOM)('FloatingPortal', () => {
  test('creates a custom id node', async () => {
    render(() => <App id="custom-id" />);
    await flushMicrotasks();
    expect(document.querySelector('#custom-id')).toBeInTheDocument();
  });

  test('uses a custom id node as the root', async () => {
    const customRoot = document.createElement('div');
    customRoot.id = 'custom-root';
    document.body.appendChild(customRoot);
    render(() => <App id="custom-root" />);
    fireEvent.click(screen.getByTestId('reference'));
    await flushMicrotasks();
    expect(screen.getByTestId('floating').parentElement?.parentElement).toBe(customRoot);
    customRoot.remove();
  });

  test('creates a custom id node as the root', async () => {
    render(() => <App id="custom-id" />);
    fireEvent.click(screen.getByTestId('reference'));
    await flushMicrotasks();
    expect(screen.getByTestId('floating').parentElement?.parentElement?.id).toBe('custom-id');
  });

  test('allows custom roots', async () => {
    const customRoot = document.createElement('div');
    customRoot.id = 'custom-root';
    document.body.appendChild(customRoot);
    render(() => <App root={customRoot} />);
    fireEvent.click(screen.getByTestId('reference'));

    await flushMicrotasks();

    const parent = screen.getByTestId('floating').parentElement;
    expect(parent?.hasAttribute('data-base-ui-portal')).toBe(true);
    expect(parent?.parentElement).toBe(customRoot);
    customRoot.remove();
  });

  test('allows refs as roots', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    render(() => <App root={el} />);
    fireEvent.click(screen.getByTestId('reference'));
    await flushMicrotasks();
    const parent = screen.getByTestId('floating').parentElement;
    expect(parent?.hasAttribute('data-base-ui-portal')).toBe(true);
    expect(parent?.parentElement).toBe(el);
    document.body.removeChild(el);
  });

  /**
   * TODO (enhancement): this test should not rely on the rendering mechanism of the framework but
   * on the logic of having state without root initially and then setting it to a value.
   * Smth like click on a button to render the root should be flexible enough to test this on all frameworks.
   */
  test('allows roots to be initially null', async () => {
    function RootApp() {
      const [root, setRoot] = createSignal<HTMLElement>();
      const [renderRoot, setRenderRoot] = createSignal(false);

      onMount(() => {
        setRenderRoot(true);
      });

      return (
        <>
          {renderRoot() && <div ref={setRoot} data-testid="root" />}
          <App root={root()} />
        </>
      );
    }

    render(() => <RootApp />);

    fireEvent.click(screen.getByTestId('reference'));
    await flushMicrotasks();
    const subRoot = screen.getByTestId('floating').parentElement;
    const root = screen.getByTestId('root');
    expect(root).toBe(subRoot?.parentElement);
  });
});
