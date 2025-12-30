import { flushMicrotasks } from '#test-utils';
import type { Coords } from '@floating-ui/dom';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, Show, mergeProps as solidMergeProps } from 'solid-js';
import { test } from 'vitest';
import { useClientPoint, useFloating, useInteractions } from '../index';

function expectLocation({ x, y }: Coords) {
  expect(Number(screen.getByTestId('x')?.textContent)).toBe(x);
  expect(Number(screen.getByTestId('y')?.textContent)).toBe(y);
  expect(Number(screen.getByTestId('width')?.textContent)).toBe(0);
  expect(Number(screen.getByTestId('height')?.textContent)).toBe(0);
}

function App(props: { enabled?: boolean; point?: Coords; axis?: 'both' | 'x' | 'y' }) {
  const merged = solidMergeProps({ enabled: true }, props);
  const [isOpen, setIsOpen] = createSignal(false);
  const { refs, elements, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });
  const clientPoint = useClientPoint(context, {
    enabled: () => merged.enabled,
    x: () => merged.point?.x,
    y: () => merged.point?.y,
    axis: () => merged.axis,
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([clientPoint]);

  const rect = () => elements.reference()?.getBoundingClientRect();

  return (
    <>
      <div
        data-testid="reference"
        ref={refs.setReference}
        {...getReferenceProps()}
        style={{ width: 0, height: 0 }}
      >
        Reference
      </div>
      <Show when={isOpen()}>
        <div data-testid="floating" ref={refs.setFloating} {...getFloatingProps()}>
          Floating
        </div>
      </Show>
      <button onClick={() => setIsOpen((v) => !v)} />
      <span data-testid="x">{rect()?.x}</span>
      <span data-testid="y">{rect()?.y}</span>
      <span data-testid="width">{rect()?.width}</span>
      <span data-testid="height">{rect()?.height}</span>
    </>
  );
}

test('renders at explicit client point and can be updated', () => {
  const [point, setPoint] = createSignal({ x: 0, y: 0 });
  render(() => <App point={point()} />);

  fireEvent.click(screen.getByRole('button'));

  expectLocation({ x: 0, y: 0 });

  setPoint({ x: 1000, y: 1000 });

  expectLocation({ x: 1000, y: 1000 });
});

test('renders at mouse event coords', () => {
  render(() => <App />);

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );

  expectLocation({ x: 500, y: 500 });

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 1000,
      clientY: 1000,
    }),
  );

  expectLocation({ x: 1000, y: 1000 });

  // Window listener isn't registered unless the floating element is open.
  fireEvent(
    window,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 700,
      clientY: 700,
    }),
  );

  expectLocation({ x: 1000, y: 1000 });

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 700,
      clientY: 700,
    }),
  );

  expectLocation({ x: 700, y: 700 });

  fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
    }),
  );

  expectLocation({ x: 0, y: 0 });
});

test('ignores mouse events when explicit coords are specified', () => {
  render(() => <App point={{ x: 0, y: 0 }} />);

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );

  expectLocation({ x: 0, y: 0 });
});

test('cleans up window listener when closing or disabling', async () => {
  const [enabled, setEnabled] = createSignal<boolean | undefined>(undefined);
  render(() => <App enabled={enabled()} />);

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );

  await flushMicrotasks();

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
    }),
  );

  await flushMicrotasks();

  expectLocation({ x: 500, y: 500 });

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );
  await flushMicrotasks();

  expectLocation({ x: 500, y: 500 });

  setEnabled(false);

  fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
    }),
  );

  await flushMicrotasks();

  expectLocation({ x: 500, y: 500 });
});

test('axis x', () => {
  render(() => <App axis="x" />);

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );

  expectLocation({ x: 500, y: 0 });
});

test('axis y', () => {
  render(() => <App axis="y" />);

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );

  expectLocation({ x: 0, y: 500 });
});

test('removes window listener when cursor lands on floating element', () => {
  render(() => <App />);

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );

  fireEvent(
    screen.getByTestId('floating'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );

  fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
    }),
  );

  expectLocation({ x: 500, y: 500 });
});
