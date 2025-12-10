import { createRenderer, isJSDOM, popupConformanceTests } from '#test-utils';
import { Dialog } from '@base-ui-components/solid/dialog';
import { Menu } from '@base-ui-components/solid/menu';
import { Select } from '@base-ui-components/solid/select';
import { fireEvent, screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createSignal } from 'solid-js';

describe('<Dialog.Root />', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  popupConformanceTests({
    createComponent: (props) => (
      <Dialog.Root {...props.root}>
        <Dialog.Trigger {...props.trigger}>Open dialog</Dialog.Trigger>
        <Dialog.Portal {...props.portal}>
          <Dialog.Popup {...props.popup}>Dialog</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ),
    render: (...args) => render(...(args as Parameters<typeof render>)),
    triggerMouseAction: 'click',
    expectedPopupRole: 'dialog',
  });

  it('ARIA attributes', () => {
    render(() => (
      <Dialog.Root modal={false} open>
        <Dialog.Trigger />
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>title text</Dialog.Title>
            <Dialog.Description>description text</Dialog.Description>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ));

    const popup = screen.queryByRole('dialog');
    expect(popup).not.to.equal(null);
    expect(popup).to.not.have.attribute('aria-modal');

    expect(screen.getByText('title text').getAttribute('id')).to.equal(
      popup?.getAttribute('aria-labelledby'),
    );
    expect(screen.getByText('description text').getAttribute('id')).to.equal(
      popup?.getAttribute('aria-describedby'),
    );
  });

  describe('prop: onOpenChange', () => {
    it('calls onOpenChange with the new open state', async () => {
      const handleOpenChange = spy();

      const { user } = render(() => (
        <Dialog.Root onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      expect(handleOpenChange.callCount).to.equal(0);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[0]).to.equal(true);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(handleOpenChange.callCount).to.equal(2);
      expect(handleOpenChange.secondCall.args[0]).to.equal(false);
    });

    it('calls onOpenChange with the reason for change when clicked on trigger and close button', async () => {
      const handleOpenChange = spy();

      const { user } = render(() => (
        <Dialog.Root onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[2]).to.equal('trigger-press');

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(handleOpenChange.callCount).to.equal(2);
      expect(handleOpenChange.secondCall.args[2]).to.equal('close-press');
    });

    it('calls onOpenChange with the reason for change when pressed Esc while the dialog is open', async () => {
      const handleOpenChange = spy();

      const { user } = render(() => (
        <Dialog.Root defaultOpen onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      await user.keyboard('[Escape]');

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[2]).to.equal('escape-key');
    });

    it('calls onOpenChange with the reason for change when user clicks backdrop while the modal dialog is open', async () => {
      const handleOpenChange = spy();

      const { user } = render(() => (
        <Dialog.Root defaultOpen onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      await user.click(screen.getByRole('presentation', { hidden: true }));

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[2]).to.equal('outside-press');
    });

    it('calls onOpenChange with the reason for change when user clicks outside while the non-modal dialog is open', async () => {
      const handleOpenChange = spy();

      const { user } = render(() => (
        <Dialog.Root defaultOpen onOpenChange={handleOpenChange} modal={false}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      await user.click(document.body);

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[2]).to.equal('outside-press');
    });

    describe.skipIf(isJSDOM)('clicks on user backdrop', () => {
      it('detects clicks on user backdrop', async () => {
        const handleOpenChange = spy();

        const { user } = render(() => (
          <Dialog.Root defaultOpen onOpenChange={handleOpenChange}>
            <Dialog.Trigger>Open</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop
                data-backdrop
                style={{ position: 'fixed', 'z-index': 10, inset: 0 }}
              />
              <Dialog.Popup style={{ position: 'fixed', 'z-index': 10 }}>
                <Dialog.Close>Close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        ));

        await user.click(document.querySelector('[data-backdrop]') as HTMLElement);

        expect(handleOpenChange.callCount).to.equal(1);
        expect(handleOpenChange.firstCall.args[2]).to.equal('outside-press');
      });

      it('does not change open state on non-main button clicks', async () => {
        const handleOpenChange = spy();

        const { user } = render(() => (
          <Dialog.Root defaultOpen onOpenChange={handleOpenChange}>
            <Dialog.Trigger>Open</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop
                data-backdrop
                style={{ position: 'fixed', 'z-index': 10, inset: 0 }}
              />
              <Dialog.Popup style={{ position: 'fixed', 'z-index': 10 }}>
                <Dialog.Close>Close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        ));

        const backdrop = document.querySelector('[data-backdrop]') as HTMLElement;
        await user.pointer([{ target: backdrop }, { keys: '[MouseRight]', target: backdrop }]);

        expect(handleOpenChange.callCount).to.equal(0);
      });
    });
  });

  describe.skipIf(isJSDOM)('prop: modal', () => {
    it('makes other interactive elements on the page inert when a modal dialog is open', async () => {
      render(() => (
        <Dialog.Root defaultOpen modal>
          <Dialog.Trigger>Open Dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close Dialog</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      expect(screen.getByRole('presentation', { hidden: true })).not.to.equal(null);
    });

    it('does not make other interactive elements on the page inert when a non-modal dialog is open', async () => {
      render(() => (
        <Dialog.Root defaultOpen modal={false}>
          <Dialog.Trigger>Open Dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close Dialog</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      expect(screen.queryByRole('presentation')).to.equal(null);
    });
  });

  describe('prop: dismissible', () => {
    (
      [
        [true, true],
        [false, false],
        [undefined, true],
      ] as const
    ).forEach(([dismissible, expectDismissed]) => {
      it(`${expectDismissed ? 'closes' : 'does not close'} the dialog when clicking outside if dismissible=${dismissible}`, async () => {
        const handleOpenChange = spy();

        render(() => (
          <div data-testid="outside">
            <Dialog.Root
              defaultOpen
              onOpenChange={handleOpenChange}
              dismissible={dismissible}
              modal={false}
            >
              <Dialog.Portal>
                <Dialog.Popup />
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        ));

        const outside = screen.getByTestId('outside');

        fireEvent.mouseDown(outside);
        expect(handleOpenChange.calledOnce).to.equal(expectDismissed);

        if (expectDismissed) {
          expect(screen.queryByRole('dialog')).to.equal(null);
        } else {
          expect(screen.queryByRole('dialog')).not.to.equal(null);
        }
      });
    });
  });

  it('waits for the exit transition to finish before unmounting', async ({ skip }) => {
    const css = `
    .dialog {
      opacity: 0;
      transition: opacity 200ms;
    }
    .dialog[data-open] {
      opacity: 1;
    }
  `;

    if (isJSDOM) {
      skip();
    }

    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const notifyTransitionEnd = spy();
    const [open, setOpen] = createSignal(false);

    render(() => (
      <Dialog.Root open={open()} modal={false}>
        {/* eslint-disable-next-line solid/no-innerhtml */}
        <style innerHTML={css} />
        <Dialog.Portal keepMounted>
          <Dialog.Popup class="dialog" onTransitionEnd={notifyTransitionEnd} />
        </Dialog.Portal>
      </Dialog.Root>
    ));

    setOpen(false);
    expect(screen.queryByRole('dialog')).not.to.equal(null);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.equal(null);
    });

    expect(notifyTransitionEnd.callCount).to.equal(1);
  });

  describe('prop: modal', () => {
    it('should render an internal backdrop when `true`', async () => {
      const { user } = render(() => (
        <div>
          <Dialog.Root modal>
            <Dialog.Trigger data-testid="trigger">Open</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup />
            </Dialog.Portal>
          </Dialog.Root>
          <button>Outside</button>
        </div>
      ));

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const popup = screen.getByRole('dialog');

      // focus guard -> internal backdrop
      expect(popup.previousElementSibling?.previousElementSibling).to.have.attribute(
        'role',
        'presentation',
      );
    });

    it('should not render an internal backdrop when `false`', async () => {
      const { user } = render(() => (
        <div>
          <Dialog.Root modal={false}>
            <Dialog.Trigger data-testid="trigger">Open</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup />
            </Dialog.Portal>
          </Dialog.Root>
          <button>Outside</button>
        </div>
      ));

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const popup = screen.getByRole('dialog');

      // focus guard -> internal backdrop
      expect(popup.previousElementSibling?.previousElementSibling).to.equal(null);
    });
  });

  it('does not dismiss previous modal dialog when clicking new modal dialog', async () => {
    function App() {
      const [openNested, setOpenNested] = createSignal(false);
      const [openNested2, setOpenNested2] = createSignal(false);

      return (
        <div>
          <Dialog.Root>
            <Dialog.Trigger>Trigger</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop />
              <Dialog.Popup>
                <button onClick={() => setOpenNested(true)}>Open nested 1</button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Root open={openNested()} onOpenChange={setOpenNested}>
            <Dialog.Portal>
              <Dialog.Backdrop />
              <Dialog.Popup>
                <button onClick={() => setOpenNested2(true)}>Open nested 2</button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Root open={openNested2()} onOpenChange={setOpenNested2}>
            <Dialog.Portal>
              <Dialog.Backdrop />
              <Dialog.Popup>Final nested</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      );
    }

    const { user } = render(() => <App />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await user.click(trigger);

    const nestedButton1 = screen.getByRole('button', { name: 'Open nested 1' });
    await user.click(nestedButton1);

    const nestedButton2 = screen.getByRole('button', { name: 'Open nested 2' });
    await user.click(nestedButton2);

    const finalDialog = screen.getByText('Final nested');

    expect(finalDialog).not.to.equal(null);
  });

  it('dismisses non-nested dialogs one by one', async () => {
    function App() {
      const [openNested, setOpenNested] = createSignal(false);
      const [openNested2, setOpenNested2] = createSignal(false);

      return (
        <div>
          <Dialog.Root>
            <Dialog.Trigger>Trigger</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup data-testid="level-1">
                <button onClick={() => setOpenNested(true)}>Open nested 1</button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Root open={openNested()} onOpenChange={setOpenNested}>
            <Dialog.Portal>
              <Dialog.Popup data-testid="level-2">
                <button onClick={() => setOpenNested2(true)}>Open nested 2</button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Root open={openNested2()} onOpenChange={setOpenNested2}>
            <Dialog.Portal>
              <Dialog.Popup data-testid="level-3">Final nested</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      );
    }

    const { user } = render(() => <App />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await user.click(trigger);

    const nestedButton1 = screen.getByRole('button', { name: 'Open nested 1' });
    await user.click(nestedButton1);

    const nestedButton2 = screen.getByRole('button', { name: 'Open nested 2' });
    await user.click(nestedButton2);

    const backdrops = Array.from(document.querySelectorAll('[role="presentation"]'));
    await user.click(backdrops[backdrops.length - 1]);

    await waitFor(() => {
      expect(screen.queryByTestId('level-3')).to.equal(null);
    });

    await user.click(backdrops[backdrops.length - 2]);

    await waitFor(() => {
      expect(screen.queryByTestId('level-2')).to.equal(null);
    });

    await user.click(backdrops[backdrops.length - 3]);

    await waitFor(() => {
      expect(screen.queryByTestId('level-1')).to.equal(null);
    });
  });

  // TODO: FIX THIS TEST
  describe.skipIf(isJSDOM)('nested popups', () => {
    it('should not dismiss the dialog when dismissing outside a nested modal menu', async () => {
      const { user } = render(() => (
        <Dialog.Root>
          <Dialog.Trigger>Open dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-testid="dialog-popup">
              <Menu.Root>
                <Menu.Trigger>Open menu</Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner data-testid="menu-positioner">
                    <Menu.Popup>
                      <Menu.Item>Item</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      const dialogTrigger = screen.getByRole('button', { name: 'Open dialog' });
      await user.click(dialogTrigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const menuTrigger = screen.getByRole('button', { name: 'Open menu' });

      await user.click(menuTrigger);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });

      const menuPositioner = screen.getByTestId('menu-positioner');
      const menuInternalBackdrop = menuPositioner.previousElementSibling as HTMLElement;

      await user.click(menuInternalBackdrop);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const dialogPopup = screen.getByTestId('dialog-popup');
      const dialogInternalBackdrop = dialogPopup.previousElementSibling
        ?.previousElementSibling as HTMLElement;

      await user.click(dialogInternalBackdrop);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
    });

    it('should not dismiss the dialog when dismissing outside a nested select menu', async () => {
      const { user } = render(() => (
        <Dialog.Root>
          <Dialog.Trigger>Open dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-testid="dialog-popup">
              <Select.Root>
                <Select.Trigger data-testid="select-trigger">Open select</Select.Trigger>
                <Select.Portal>
                  <Select.Positioner data-testid="select-positioner">
                    <Select.Popup>
                      <Select.Item>Item</Select.Item>
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      const dialogTrigger = screen.getByRole('button', { name: 'Open dialog' });
      await user.click(dialogTrigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const selectTrigger = screen.getByTestId('select-trigger');

      await user.click(selectTrigger);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      const selectPositioner = screen.getByTestId('select-positioner');
      const selectInternalBackdrop = selectPositioner.previousElementSibling as HTMLElement;

      await user.click(selectInternalBackdrop);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const dialogPopup = screen.getByTestId('dialog-popup');
      const dialogInternalBackdrop = dialogPopup.previousElementSibling
        ?.previousElementSibling as HTMLElement;

      await user.click(dialogInternalBackdrop);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
    });

    // TODO: FIX THIS TEST
    it('should not close the parent menu when Escape is pressed in a nested dialog', async () => {
      const { user } = render(() => (
        <Menu.Root>
          <Menu.Trigger>Open menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Dialog.Root>
                  <Menu.Item
                    closeOnClick={false}
                    render={(props) => <Dialog.Trigger nativeButton={false} {...props} />}
                  >
                    Open dialog
                  </Menu.Item>
                  <Dialog.Portal>
                    <Dialog.Popup />
                  </Dialog.Portal>
                </Dialog.Root>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      ));

      const menuTrigger = screen.getByRole('button', { name: 'Open menu' });
      await user.click(menuTrigger);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });

      const dialogTrigger = screen.getByRole('menuitem', { name: 'Open dialog' });
      await user.click(dialogTrigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      await user.keyboard('[Escape]');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });
    });
  });

  describe('prop: actionsRef', () => {
    it('unmounts the dialog when the `unmount` method is called', async () => {
      const actionsRef = {
        unmount: spy(),
      };

      const { user } = render(() => (
        <Dialog.Root actionsRef={actionsRef}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup />
          </Dialog.Portal>
        </Dialog.Root>
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

  describe.skipIf(isJSDOM)('prop: onOpenChangeComplete', () => {
    it('is called on close when there is no exit animation defined', async () => {
      const onOpenChangeComplete = spy();

      function Test() {
        const [open, setOpen] = createSignal(true);
        return (
          <div>
            <button onClick={() => setOpen(false)}>Close</button>
            <Dialog.Root open={open()} onOpenChangeComplete={onOpenChangeComplete}>
              <Dialog.Portal>
                <Dialog.Popup data-testid="popup" />
              </Dialog.Portal>
            </Dialog.Root>
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
            <Dialog.Root open={open()} onOpenChangeComplete={onOpenChangeComplete}>
              <Dialog.Portal>
                <Dialog.Popup class="animation-test-indicator" data-testid="popup" />
              </Dialog.Portal>
            </Dialog.Root>
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
            <Dialog.Root open={open()} onOpenChangeComplete={onOpenChangeComplete}>
              <Dialog.Portal>
                <Dialog.Popup data-testid="popup" />
              </Dialog.Portal>
            </Dialog.Root>
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
            <Dialog.Root
              open={open()}
              onOpenChange={setOpen}
              onOpenChangeComplete={onOpenChangeComplete}
            >
              <Dialog.Portal>
                <Dialog.Popup class="animation-test-indicator" data-testid="popup" />
              </Dialog.Portal>
            </Dialog.Root>
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
        <Dialog.Root onOpenChangeComplete={onOpenChangeComplete}>
          <Dialog.Portal>
            <Dialog.Popup data-testid="popup" />
          </Dialog.Portal>
        </Dialog.Root>
      ));

      expect(onOpenChangeComplete.callCount).to.equal(0);
    });
  });
});
