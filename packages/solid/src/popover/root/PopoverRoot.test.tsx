import { createRenderer, flushMicrotasks, isJSDOM, popupConformanceTests } from '#test-utils';
import { Popover } from '@base-ui-components/solid/popover';
import { fireEvent, screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createSignal } from 'solid-js';
import { OPEN_DELAY } from '../utils/constants';

function Root(props: Popover.Root.Props) {
  return <Popover.Root {...props} />;
}

describe('<Popover.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, clock } = createRenderer();

  popupConformanceTests({
    createComponent: (props) => (
      <Popover.Root {...props.root}>
        <Popover.Trigger {...props.trigger}>Open menu</Popover.Trigger>
        <Popover.Portal {...props.portal}>
          <Popover.Positioner>
            <Popover.Popup {...props.popup}>Content</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ),
    render: (...args) => render(...(args as Parameters<typeof render>)),
    triggerMouseAction: 'click',
    expectedPopupRole: 'dialog',
  });

  it('should render the children', async () => {
    render(() => (
      <Root>
        <Popover.Trigger>Content</Popover.Trigger>
      </Root>
    ));

    expect(screen.getByText('Content')).not.to.equal(null);
  });

  describe('uncontrolled open', () => {
    it('should close when the anchor is clicked twice', async () => {
      render(() => (
        <Root>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>
      ));

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('controlled open', () => {
    it('should call onChange when the open state changes', async () => {
      const handleChange = spy();

      function App() {
        const [open, setOpen] = createSignal(false);

        return (
          <Root
            open={open()}
            onOpenChange={(nextOpen) => {
              handleChange(open());
              setOpen(nextOpen);
            }}
          >
            <Popover.Trigger />
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Root>
        );
      }

      render(() => <App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
      expect(handleChange.callCount).to.equal(2);
      expect(handleChange.firstCall.args[0]).to.equal(false);
      expect(handleChange.secondCall.args[0]).to.equal(true);
    });

    it('should not call onChange when the open state does not change', async () => {
      const handleChange = spy();

      function App() {
        const [open, setOpen] = createSignal(false);

        return (
          <Root
            open={open()}
            onOpenChange={(nextOpen) => {
              handleChange(open());
              setOpen(nextOpen);
            }}
          >
            <Popover.Trigger />
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Root>
        );
      }

      render(() => <App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[0]).to.equal(false);
    });
  });

  describe('prop: defaultOpen', () => {
    it('should open when the component is rendered', async () => {
      render(() => (
        <Root defaultOpen>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>
      ));

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should not open when the component is rendered and open is controlled', async () => {
      render(() => (
        <Root defaultOpen open={false}>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>
      ));

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should not close when the component is rendered and open is controlled', async () => {
      render(() => (
        <Root defaultOpen open>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>
      ));

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should remain uncontrolled', async () => {
      render(() => (
        <Root defaultOpen>
          <Popover.Trigger data-testid="trigger" />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>
      ));

      expect(screen.getByText('Content')).not.to.equal(null);

      const anchor = screen.getByTestId('trigger');

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('should open after delay with rest type by default', async () => {
      render(() => (
        <Root openOnHover delay={100}>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>
      ));

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(100);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });
  });

  describe('prop: closeDelay', () => {
    clock.withFakeTimers();

    it('should close after delay', async () => {
      render(() => (
        <Root openOnHover closeDelay={100}>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>
      ));

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(anchor);

      clock.tick(50);

      expect(screen.getByText('Content')).not.to.equal(null);

      clock.tick(50);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('focus management', () => {
    it('focuses the trigger after the popover is closed but not unmounted', async () => {
      const { user } = render(() => (
        <div>
          <input type="text" />
          <Popover.Root>
            <Popover.Trigger>Toggle</Popover.Trigger>
            <Popover.Portal keepMounted>
              <Popover.Positioner>
                <Popover.Popup>
                  <Popover.Close>Close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <input type="text" />
        </div>
      ));

      const toggle = screen.getByRole('button', { name: 'Toggle' });

      await user.click(toggle);
      await flushMicrotasks();

      const close = screen.getByRole('button', { name: 'Close' });

      await user.click(close);

      await waitFor(
        () => {
          expect(toggle).toHaveFocus();
        },
        { timeout: 1500 },
      );
    });

    it('does not move focus to the popover when opened with hover', async () => {
      const { user } = render(() => (
        <Popover.Root openOnHover delay={0}>
          <Popover.Trigger>Toggle</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Close>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const toggle = screen.getByRole('button', { name: 'Toggle' });

      toggle.focus();

      await user.hover(toggle);
      await flushMicrotasks();

      const close = screen.getByRole('button', { name: 'Close' });

      expect(close).not.to.equal(null);
      expect(close).not.to.toHaveFocus();
    });

    it('does not change focus when opened with hover and closed', async () => {
      const style = `
        .popup {
          width: 100px;
          height: 100px;
          background-color: red;
          opacity: 1;
          transition: opacity 1ms;
        }

        .popup[data-exiting] {
          opacity: 0;
        }
      `;

      const { user } = render(() => (
        <div>
          {/* eslint-disable-next-line solid/no-innerhtml */}
          <style innerHTML={style} />
          <input type="text" data-testid="first-input" />
          <Popover.Root openOnHover delay={0} closeDelay={0}>
            <Popover.Trigger>Toggle</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup class="popup" />
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <input type="text" data-testid="last-input" />
        </div>
      ));

      const toggle = screen.getByRole('button', { name: 'Toggle' });
      const firstInput = screen.getByTestId('first-input');
      const lastInput = screen.getByTestId('last-input');

      lastInput.focus();

      await user.hover(toggle);
      await flushMicrotasks();

      await user.hover(firstInput);
      await flushMicrotasks();

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });

      expect(lastInput).toHaveFocus();
    });
  });

  describe('prop: actionsRef', () => {
    it('unmounts the popover when the `unmount` method is called', async () => {
      const actionsRef = {
        unmount: spy(),
      };

      const { user } = render(() => (
        <Popover.Root actionsRef={actionsRef}>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      actionsRef.unmount();

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
    });
  });

  describe('prop: modal', () => {
    it('should render an internal backdrop when `true`', async () => {
      const { user } = render(() => (
        <div>
          <Popover.Root modal>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner">
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <button>Outside</button>
        </div>
      ));

      const trigger = screen.getByRole('button', { name: 'Open' });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const positioner = screen.getByTestId('positioner');

      expect(positioner.previousElementSibling).to.have.attribute('role', 'presentation');
    });

    it('should not render an internal backdrop when `false`', async () => {
      const { user } = render(() => (
        <div>
          <Popover.Root modal={false}>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner">
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <button>Outside</button>
        </div>
      ));

      const trigger = screen.getByRole('button', { name: 'Open' });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const positioner = screen.getByTestId('positioner');

      expect(positioner.previousElementSibling).to.equal(null);
    });
  });

  describe.skipIf(isJSDOM)('prop: onOpenChangeComplete', () => {
    it('is called on close when there is no exit animation defined', async () => {
      const onOpenChangeComplete = spy();

      function Test() {
        const [open, setOpen] = createSignal(true);
        return (
          <div>
            <button onClick={() => setOpen(false)}>Close</button>
            <Popover.Root open={open()} onOpenChangeComplete={onOpenChangeComplete}>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = render(() => <Test />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).to.equal(null);
      });

      expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
    });

    it('is called on close when the exit animation finishes', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const onOpenChangeComplete = spy();

      function Test() {
        const style = `
          @keyframes test-anim {
            to {
              opacity: 0;
            }
          }

          .animation-test-indicator[data-ending-style] {
            animation: test-anim 1ms;
          }
        `;

        const [open, setOpen] = createSignal(true);

        return (
          <div>
            {/* eslint-disable-next-line solid/no-innerhtml */}
            <style innerHTML={style} />
            <button onClick={() => setOpen(false)}>Close</button>
            <Popover.Root open={open()} onOpenChangeComplete={onOpenChangeComplete}>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup class="animation-test-indicator" data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = render(() => <Test />);

      expect(screen.getByTestId('popup')).not.to.equal(null);

      // Wait for open animation to finish
      await waitFor(() => {
        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      });

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).to.equal(null);
      });

      expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
    });

    it('is called on open when there is no enter animation defined', async () => {
      const onOpenChangeComplete = spy();

      function Test() {
        const [open, setOpen] = createSignal(false);
        return (
          <div>
            <button onClick={() => setOpen(true)}>Open</button>
            <Popover.Root open={open()} onOpenChangeComplete={onOpenChangeComplete}>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = render(() => <Test />);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).not.to.equal(null);
      });

      expect(onOpenChangeComplete.callCount).to.equal(2);
      expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
    });

    it('is called on open when the enter animation finishes', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const onOpenChangeComplete = spy();

      function Test() {
        const style = `
          @keyframes test-anim {
            from {
              opacity: 0;
            }
          }

          .animation-test-indicator[data-starting-style] {
            animation: test-anim 1ms;
          }
        `;

        const [open, setOpen] = createSignal(false);

        return (
          <div>
            {/* eslint-disable-next-line solid/no-innerhtml */}
            <style innerHTML={style} />
            <button onClick={() => setOpen(true)}>Open</button>
            <Popover.Root
              open={open()}
              onOpenChange={setOpen}
              onOpenChangeComplete={onOpenChangeComplete}
            >
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup class="animation-test-indicator" data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = render(() => <Test />);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      // Wait for open animation to finish
      await waitFor(() => {
        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      });

      expect(screen.queryByTestId('popup')).not.to.equal(null);
    });

    it('does not get called on mount when not open', async () => {
      const onOpenChangeComplete = spy();

      render(() => (
        <Popover.Root onOpenChangeComplete={onOpenChangeComplete}>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      expect(onOpenChangeComplete.callCount).to.equal(0);
    });
  });
});
