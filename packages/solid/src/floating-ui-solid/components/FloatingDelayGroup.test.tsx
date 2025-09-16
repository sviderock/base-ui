/* eslint-disable @typescript-eslint/no-shadow */
import { flushMicrotasks } from '#test-utils';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { type Component, createEffect, createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { vi } from 'vitest';

import { isJSDOM } from '../../utils/detectBrowser';
import {
  FloatingDelayGroup,
  useDelayGroup,
  useFloating,
  useHover,
  useInteractions,
} from '../index';

vi.useFakeTimers();

interface Props {
  label: string;
  children: Component;
}

function Tooltip(props: Props) {
  const [open, setOpen] = createSignal(false);

  const { x, y, refs, strategy, context } = useFloating({
    open,
    onOpenChange: setOpen,
  });

  const { delayRef } = useDelayGroup(context);
  const hover = useHover(context, { delay: delayRef });
  const { getReferenceProps } = useInteractions(() => [hover()]);

  let renderCount = 0;
  let renderCountRef: HTMLSpanElement | undefined;

  createEffect(() => {
    // eslint-disable-next-line no-plusplus
    renderCount++;
    if (renderCountRef) {
      renderCountRef.textContent = String(renderCount);
    }
  });

  return (
    <>
      <Dynamic component={props.children} {...getReferenceProps({ ref: refs.setReference })} />
      <span data-testid={`render-count-${props.label}`} ref={renderCountRef} />
      {open() && (
        <div
          data-testid={`floating-${props.label}`}
          ref={refs.setFloating}
          style={{
            position: strategy(),
            top: `${y() ?? 0}px`,
            left: `${x() ?? 0}px`,
          }}
        >
          {props.label}
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <FloatingDelayGroup delay={{ open: 1000, close: 200 }}>
      <Tooltip label="one">{(p) => <button data-testid="reference-one" {...p} />}</Tooltip>
      <Tooltip label="two">{(p) => <button data-testid="reference-two" {...p} />}</Tooltip>
      <Tooltip label="three">{(p) => <button data-testid="reference-three" {...p} />}</Tooltip>
    </FloatingDelayGroup>
  );
}

describe.skipIf(!isJSDOM)('FloatingDelayGroup', () => {
  test('groups delays correctly', async () => {
    render(() => <App />);

    fireEvent.mouseEnter(screen.getByTestId('reference-one'));

    vi.advanceTimersByTime(1);
    await flushMicrotasks();

    expect(screen.queryByTestId('floating-one')).not.toBeInTheDocument();

    vi.advanceTimersByTime(999);
    await flushMicrotasks();

    expect(screen.getByTestId('floating-one')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByTestId('reference-two'));

    vi.advanceTimersByTime(1);
    await flushMicrotasks();

    expect(screen.queryByTestId('floating-one')).not.toBeInTheDocument();
    expect(screen.getByTestId('floating-two')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByTestId('reference-three'));

    vi.advanceTimersByTime(1);
    await flushMicrotasks();

    expect(screen.queryByTestId('floating-two')).not.toBeInTheDocument();
    expect(screen.getByTestId('floating-three')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByTestId('reference-three'));

    vi.advanceTimersByTime(1);
    await flushMicrotasks();

    expect(screen.getByTestId('floating-three')).toBeInTheDocument();

    vi.advanceTimersByTime(199);
    await flushMicrotasks();

    expect(screen.queryByTestId('floating-three')).not.toBeInTheDocument();
  });

  test('timeoutMs', async () => {
    function App() {
      return (
        <FloatingDelayGroup delay={{ open: 1000, close: 100 }} timeoutMs={500}>
          <Tooltip label="one">{(p) => <button data-testid="reference-one" {...p} />}</Tooltip>
          <Tooltip label="two">{(p) => <button data-testid="reference-two" {...p} />}</Tooltip>
          <Tooltip label="three">{(p) => <button data-testid="reference-three" {...p} />}</Tooltip>
        </FloatingDelayGroup>
      );
    }

    render(() => <App />);

    fireEvent.mouseEnter(screen.getByTestId('reference-one'));

    vi.advanceTimersByTime(1000);
    await flushMicrotasks();

    fireEvent.mouseLeave(screen.getByTestId('reference-one'));

    expect(screen.getByTestId('floating-one')).toBeInTheDocument();

    vi.advanceTimersByTime(499);
    await flushMicrotasks();

    expect(screen.queryByTestId('floating-one')).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByTestId('reference-two'));

    vi.advanceTimersByTime(1);
    await flushMicrotasks();

    expect(screen.getByTestId('floating-two')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByTestId('reference-three'));

    vi.advanceTimersByTime(1);
    await flushMicrotasks();

    expect(screen.queryByTestId('floating-two')).not.toBeInTheDocument();
    expect(screen.getByTestId('floating-three')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByTestId('reference-three'));

    vi.advanceTimersByTime(1);
    await flushMicrotasks();

    expect(screen.getByTestId('floating-three')).toBeInTheDocument();

    vi.advanceTimersByTime(99);
    await flushMicrotasks();

    expect(screen.queryByTestId('floating-three')).not.toBeInTheDocument();
  });

  it('does not re-render unrelated consumers', async () => {
    function App() {
      return (
        <FloatingDelayGroup delay={{ open: 1000, close: 100 }} timeoutMs={500}>
          <Tooltip label="one">{(p) => <button data-testid="reference-one" {...p} />}</Tooltip>
          <Tooltip label="two">{(p) => <button data-testid="reference-two" {...p} />}</Tooltip>
          <Tooltip label="three">{(p) => <button data-testid="reference-three" {...p} />}</Tooltip>
        </FloatingDelayGroup>
      );
    }

    render(() => <App />);

    fireEvent.mouseEnter(screen.getByTestId('reference-one'));

    vi.advanceTimersByTime(1000);
    await flushMicrotasks();

    fireEvent.mouseLeave(screen.getByTestId('reference-one'));

    expect(screen.getByTestId('floating-one')).toBeInTheDocument();

    vi.advanceTimersByTime(499);
    await flushMicrotasks();

    expect(screen.queryByTestId('floating-one')).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByTestId('reference-two'));

    vi.advanceTimersByTime(1);
    await flushMicrotasks();

    expect(screen.getByTestId('floating-two')).toBeInTheDocument();
    // TODO: with fine-grained reactivity in Solid, we always expect 1 render count on 1 change
    expect(screen.queryByTestId('render-count-one')).toHaveTextContent('1');
    expect(screen.queryByTestId('render-count-two')).toHaveTextContent('1');
    expect(screen.queryByTestId('render-count-three')).toHaveTextContent('1');
  });
});
