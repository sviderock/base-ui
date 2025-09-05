/* eslint-disable @typescript-eslint/no-shadow */
import { flushMicrotasks } from '#test-utils';
import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { createEffect, createSignal } from 'solid-js';
import { test, vi } from 'vitest';
import { Popover } from '../../../test/floating-ui-tests/Popover';
import { isJSDOM } from '../../utils/detectBrowser';
import { useFloating, useHover, useInteractions } from '../index';
import type { UseHoverProps } from './useHover';

vi.useFakeTimers();

function App(props: UseHoverProps & { showReference?: boolean }) {
  const showReference = () => props.showReference ?? true;
  const [open, setOpen] = createSignal(false);
  const { refs, context } = useFloating({
    open,
    onOpenChange: setOpen,
  });

  const hover = useHover(context, props);
  const { getReferenceProps, getFloatingProps } = useInteractions(() => [hover()]);

  return (
    <>
      {showReference() && <button {...getReferenceProps({ ref: refs.setReference })} />}
      {open() && <div role="tooltip" {...getFloatingProps({ ref: refs.setFloating })} />}
    </>
  );
}

describe.skipIf(!isJSDOM)('useHover', () => {
  test('opens on mouseenter', async () => {
    render(() => <App />);

    fireEvent.mouseEnter(screen.getByRole('button'));

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    cleanup();
  });

  test('closes on mouseleave', () => {
    render(() => <App />);

    fireEvent.mouseEnter(screen.getByRole('button'));
    fireEvent.mouseLeave(screen.getByRole('button'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    cleanup();
  });

  describe('delay', () => {
    test('symmetric number', async () => {
      render(() => <App delay={() => 1000} />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      vi.advanceTimersByTime(999);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      vi.advanceTimersByTime(1);

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      cleanup();
    });

    test('open', async () => {
      render(() => <App delay={() => ({ open: 500 })} />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      vi.advanceTimersByTime(499);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      vi.advanceTimersByTime(1);

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      cleanup();
    });

    test('close', async () => {
      render(() => <App delay={() => ({ close: 500 })} />);

      fireEvent.mouseEnter(screen.getByRole('button'));
      fireEvent.mouseLeave(screen.getByRole('button'));

      vi.advanceTimersByTime(499);

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      vi.advanceTimersByTime(1);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      cleanup();
    });

    test('open with close 0', async () => {
      render(() => <App delay={() => ({ open: 500 })} />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      vi.advanceTimersByTime(499);

      fireEvent.mouseLeave(screen.getByRole('button'));

      vi.advanceTimersByTime(1);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      cleanup();
    });

    test('restMs + nullish open delay should respect restMs', async () => {
      render(() => <App restMs={() => 100} delay={() => ({ close: 100 })} />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      vi.advanceTimersByTime(99);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      cleanup();
    });
  });

  test('restMs', async () => {
    render(() => <App restMs={() => 100} />);

    const button = screen.getByRole('button');

    const originalDispatchEvent = button.dispatchEvent;
    const spy = vi.spyOn(button, 'dispatchEvent').mockImplementation((event) => {
      Object.defineProperty(event, 'movementX', { value: 10 });
      Object.defineProperty(event, 'movementY', { value: 10 });
      return originalDispatchEvent.call(button, event);
    });

    fireEvent.mouseMove(button);

    vi.advanceTimersByTime(99);

    fireEvent.mouseMove(button);

    vi.advanceTimersByTime(1);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.mouseMove(button);

    vi.advanceTimersByTime(100);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    spy.mockRestore();
    cleanup();
  });

  test.skip('restMs is always 0 for touch input', async () => {
    render(() => <App restMs={() => 100} />);

    fireEvent.pointerDown(screen.getByRole('button'), { pointerType: 'touch' });
    fireEvent.mouseMove(screen.getByRole('button'));

    await flushMicrotasks();

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  test('restMs does not cause floating element to open if mouseOnly is true', async () => {
    render(() => <App restMs={() => 100} mouseOnly={() => true} />);

    fireEvent.pointerDown(screen.getByRole('button'), { pointerType: 'touch' });
    fireEvent.mouseMove(screen.getByRole('button'));

    await flushMicrotasks();

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('restMs does not reset timer for minor mouse movement', async () => {
    render(() => <App restMs={() => 100} />);

    const button = screen.getByRole('button');

    const originalDispatchEvent = button.dispatchEvent;
    const spy = vi.spyOn(button, 'dispatchEvent').mockImplementation((event) => {
      Object.defineProperty(event, 'movementX', { value: 1 });
      Object.defineProperty(event, 'movementY', { value: 0 });
      return originalDispatchEvent.call(button, event);
    });

    fireEvent.mouseMove(button);

    vi.advanceTimersByTime(99);

    fireEvent.mouseMove(button);

    vi.advanceTimersByTime(1);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    spy.mockRestore();
    cleanup();
  });

  test('mouseleave on the floating element closes it (mouse)', async () => {
    render(() => <App />);

    fireEvent.mouseEnter(screen.getByRole('button'));
    await flushMicrotasks();

    fireEvent(
      screen.getByRole('button'),
      new MouseEvent('mouseleave', {
        relatedTarget: screen.getByRole('tooltip'),
      }),
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('does not show after delay if domReference changes', async () => {
    const [showReference, setShowReference] = createSignal<boolean | undefined>(undefined);
    render(() => <App delay={() => 1000} showReference={showReference()} />);

    fireEvent.mouseEnter(screen.getByRole('button'));

    vi.advanceTimersByTime(1);

    setShowReference(false);

    vi.advanceTimersByTime(999);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    cleanup();
  });

  test('reason string', async () => {
    function App() {
      const [isOpen, setIsOpen] = createSignal(false);
      const { refs, context } = useFloating({
        open: isOpen,
        onOpenChange(isOpen, _, reason) {
          setIsOpen(isOpen);
          expect(reason).toBe('hover');
        },
      });

      const hover = useHover(context);
      const { getReferenceProps, getFloatingProps } = useInteractions(() => [hover()]);

      return (
        <>
          <button ref={refs.setReference} {...getReferenceProps()} />
          {isOpen() && <div role="tooltip" ref={refs.setFloating} {...getFloatingProps()} />}
        </>
      );
    }

    render(() => <App />);
    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    await flushMicrotasks();
    fireEvent.mouseLeave(button);
  });

  test('cleans up blockPointerEvents if trigger changes', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(() => (
      <Popover
        hover={false}
        modal={false}
        bubbles
        render={(props1) => (
          <>
            <h2 id={props1.labelId} class="mb-2 text-2xl font-bold">
              Parent title
            </h2>
            <p id={props1.descriptionId} class="mb-2">
              Description
            </p>
            <Popover
              hover
              modal={false}
              bubbles
              render={(props2) => (
                <>
                  <h2 id={props2.labelId} class="mb-2 text-2xl font-bold">
                    Child title
                  </h2>
                  <p id={props2.descriptionId} class="mb-2">
                    Description
                  </p>
                  <button onClick={props2.close} class="font-bold">
                    Close
                  </button>
                </>
              )}
            >
              {(p) => (
                <button type="button" {...p}>
                  Open child
                </button>
              )}
            </Popover>
            <button onClick={props1.close} class="font-bold">
              Close
            </button>
          </>
        )}
      >
        {(p) => (
          <button type="button" {...p}>
            Open parent
          </button>
        )}
      </Popover>
    ));

    await user.click(screen.getByText('Open parent'));
    expect(screen.getByText('Parent title')).toBeInTheDocument();
    await user.click(screen.getByText('Open child'));
    expect(screen.getByText('Child title')).toBeInTheDocument();
    await user.click(screen.getByText('Child title'));
    // clean up blockPointerEvents
    // userEvent.unhover does not work because of the pointer-events
    fireEvent.mouseLeave(screen.getByRole('dialog', { name: 'Child title' }));
    expect(screen.getByText('Child title')).toBeInTheDocument();
    await user.click(screen.getByText('Parent title'));
    // screen.debug();
    expect(screen.getByText('Parent title')).toBeInTheDocument();

    vi.useFakeTimers();
  });
});
