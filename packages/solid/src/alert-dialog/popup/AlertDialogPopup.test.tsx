import { createRenderer, describeConformance } from '#test-utils';
import { AlertDialog } from '@base-ui-components/solid/alert-dialog';
import { Dialog } from '@base-ui-components/solid/dialog';
import { screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';

describe('<AlertDialog.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(AlertDialog.Popup, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <AlertDialog.Root open>
            <AlertDialog.Portal>
              <AlertDialog.Backdrop />
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </AlertDialog.Portal>
          </AlertDialog.Root>
        ),
        elementProps,
      );
    },
  }));

  it('should have role="alertdialog"', async () => {
    render(() => (
      <AlertDialog.Root open>
        <AlertDialog.Backdrop />
        <AlertDialog.Portal>
          <AlertDialog.Popup data-testid="test-alert-dialog" />
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ));

    const dialog = screen.getByTestId('test-alert-dialog');
    expect(dialog).to.have.attribute('role', 'alertdialog');
  });

  describe('prop: initial focus', () => {
    it('should focus the first focusable element within the popup by default', async () => {
      render(() => (
        <div>
          <input />
          <AlertDialog.Root>
            <AlertDialog.Backdrop />
            <AlertDialog.Trigger>Open</AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Popup data-testid="dialog">
                <input data-testid="dialog-input" />
                <button>Close</button>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
          <input />
        </div>
      ));

      const trigger = screen.getByText('Open');
      trigger.click();

      await waitFor(() => {
        const dialogInput = screen.getByTestId('dialog-input');
        expect(dialogInput).to.toHaveFocus();
      });
    });

    it('should focus the element provided to `initialFocus` as a ref when open', async () => {
      function TestComponent() {
        const [input2Ref, setInput2Ref] = createSignal<HTMLInputElement | null>(null);
        return (
          <div>
            <input />
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="dialog" initialFocus={input2Ref}>
                  <input data-testid="input-1" />
                  <input data-testid="input-2" ref={setInput2Ref} />
                  <input data-testid="input-3" />
                  <button>Close</button>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
            <input />
          </div>
        );
      }

      render(() => <TestComponent />);

      const trigger = screen.getByText('Open');
      trigger.click();

      await waitFor(() => {
        const input2 = screen.getByTestId('input-2');
        expect(input2).to.toHaveFocus();
      });
    });

    it('should focus the element provided to `initialFocus` as a function when open', async () => {
      function TestComponent() {
        const [input2Ref, setInput2Ref] = createSignal<HTMLInputElement | null>(null);

        const getRef = () => input2Ref();

        return (
          <div>
            <input />
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="dialog" initialFocus={getRef}>
                  <input data-testid="input-1" />
                  <input data-testid="input-2" ref={setInput2Ref} />
                  <input data-testid="input-3" />
                  <button>Close</button>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
            <input />
          </div>
        );
      }

      render(() => <TestComponent />);

      const trigger = screen.getByText('Open');
      trigger.click();

      await waitFor(() => {
        const input2 = screen.getByTestId('input-2');
        expect(input2).to.toHaveFocus();
      });
    });
  });

  describe('prop: final focus', () => {
    it('should focus the trigger by default when closed', async () => {
      const { user } = render(() => (
        <div>
          <input />
          <AlertDialog.Root>
            <AlertDialog.Backdrop />
            <AlertDialog.Trigger>Open</AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Popup>
                <AlertDialog.Close>Close</AlertDialog.Close>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
          <input />
        </div>
      ));

      const trigger = screen.getByText('Open');
      await user.click(trigger);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('should focus the element provided to the prop when closed', async () => {
      function TestComponent() {
        const [inputRef, setInputRef] = createSignal<HTMLInputElement | null>(null);
        return (
          <div>
            <input />
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Popup finalFocus={inputRef}>
                  <AlertDialog.Close>Close</AlertDialog.Close>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
            <input />
            <input data-testid="input-to-focus" ref={setInputRef} />
            <input />
          </div>
        );
      }

      const { user } = render(() => <TestComponent />);

      const trigger = screen.getByText('Open');
      await user.click(trigger);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      const inputToFocus = screen.getByTestId('input-to-focus');

      await waitFor(() => {
        expect(inputToFocus).toHaveFocus();
      });
    });
  });

  describe('style hooks', () => {
    it('adds the `nested` and `nested-dialog-open` style hooks if a dialog has a parent dialog', async () => {
      render(() => (
        <AlertDialog.Root open>
          <AlertDialog.Portal>
            <AlertDialog.Popup data-testid="parent-dialog" />
            <AlertDialog.Root open>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="nested-dialog">
                  <AlertDialog.Root>
                    <AlertDialog.Portal>
                      <AlertDialog.Popup />
                    </AlertDialog.Portal>
                  </AlertDialog.Root>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      ));

      const parentDialog = screen.getByTestId('parent-dialog');
      const nestedDialog = screen.getByTestId('nested-dialog');

      expect(parentDialog).not.to.have.attribute('data-nested');
      expect(nestedDialog).to.have.attribute('data-nested');

      expect(parentDialog).to.have.attribute('data-nested-dialog-open');
      expect(nestedDialog).not.to.have.attribute('data-nested-dialog-open');
    });

    it('adds the `nested` and `nested-dialog-open` style hooks on an alert dialog if has a parent dialog', async () => {
      render(() => (
        <Dialog.Root open>
          <Dialog.Portal>
            <Dialog.Popup data-testid="parent-dialog" />
            <AlertDialog.Root open>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="nested-dialog">
                  <AlertDialog.Root>
                    <AlertDialog.Portal>
                      <AlertDialog.Popup />
                    </AlertDialog.Portal>
                  </AlertDialog.Root>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      const parentDialog = screen.getByTestId('parent-dialog');
      const nestedDialog = screen.getByTestId('nested-dialog');

      expect(parentDialog).not.to.have.attribute('data-nested');
      expect(nestedDialog).to.have.attribute('data-nested');

      expect(parentDialog).to.have.attribute('data-nested-dialog-open');
      expect(nestedDialog).not.to.have.attribute('data-nested-dialog-open');
    });
  });
});
