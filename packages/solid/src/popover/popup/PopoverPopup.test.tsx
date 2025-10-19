import { createRenderer, describeConformance } from '#test-utils';
import { Popover } from '@base-ui-components/solid/popover';
import { screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Popover.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(Popover.Popup, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Popover.Root open>
            <Popover.Portal>
              <Popover.Positioner>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        ),
        elementProps,
      );
    },
  }));

  it('should render the children', async () => {
    render(() => (
      <Popover.Root open>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ));

    expect(screen.getByText('Content')).not.to.equal(null);
  });

  describe('prop: initial focus', () => {
    it('should focus the first focusable element within the popup by default', async () => {
      render(() => (
        <div>
          <input />
          <Popover.Root>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="popover">
                  <input data-testid="popover-input" />
                  <button>Close</button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <input />
        </div>
      ));

      const trigger = screen.getByText('Open');
      trigger.click();

      await waitFor(() => {
        const innerInput = screen.getByTestId('popover-input');
        expect(innerInput).to.toHaveFocus();
      });
    });

    it('should focus the element provided to `initialFocus` as a ref when open', async () => {
      function TestComponent() {
        let input2Ref;
        return (
          <div>
            <input />
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup initialFocus={input2Ref}>
                    <input data-testid="input-1" />
                    <input data-testid="input-2" ref={input2Ref} />
                    <input data-testid="input-3" />
                    <button>Close</button>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
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
        let input2Ref;

        const getRef = () => input2Ref;

        return (
          <div>
            <input />
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup initialFocus={getRef}>
                    <input data-testid="input-1" />
                    <input data-testid="input-2" ref={input2Ref} />
                    <input data-testid="input-3" />
                    <button>Close</button>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
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
      render(() => (
        <div>
          <input />
          <Popover.Root>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>
                  <Popover.Close>Close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <input />
        </div>
      ));

      const trigger = screen.getByText('Open');
      trigger.click();

      const closeButton = screen.getByText('Close');
      closeButton.click();

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('should focus the element provided to the prop when closed', async () => {
      function TestComponent() {
        let inputRef;
        return (
          <div>
            <input />
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup finalFocus={inputRef}>
                    <Popover.Close>Close</Popover.Close>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
            <input />
            <input data-testid="input-to-focus" ref={inputRef} />
            <input />
          </div>
        );
      }

      render(() => <TestComponent />);

      const trigger = screen.getByText('Open');
      trigger.click();

      const closeButton = screen.getByText('Close');
      closeButton.click();

      const inputToFocus = screen.getByTestId('input-to-focus');

      await waitFor(() => {
        expect(inputToFocus).toHaveFocus();
      });
    });
  });
});
