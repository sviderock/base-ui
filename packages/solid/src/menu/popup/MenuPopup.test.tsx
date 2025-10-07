import { createRenderer, describeConformance } from '#test-utils';
import { Menu } from '@base-ui-components/solid/menu';
import { screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Menu.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(Menu.Popup, () => ({
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        ),
        elementProps,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  describe('prop: finalFocus', () => {
    it('should focus the trigger by default when closed', async () => {
      const { getByText } = render(() => (
        <div>
          <input />
          <Menu.Root>
            <Menu.Trigger>Open</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>Close</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <input />
        </div>
      ));

      const trigger = getByText('Open');
      trigger.click();

      const closeButton = screen.getByText('Close');
      closeButton.click();

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('should focus the element provided to the prop when closed', async () => {
      function TestComponent() {
        let inputRef: HTMLInputElement | undefined;
        return (
          <div>
            <input />
            <Menu.Root>
              <Menu.Trigger>Open</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup finalFocus={inputRef}>
                    <Menu.Item>Close</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
            <input />
            <input data-testid="input-to-focus" ref={inputRef} />
            <input />
          </div>
        );
      }

      const { getByText, getByTestId } = render(() => <TestComponent />);

      const trigger = getByText('Open');
      trigger.click();

      const closeButton = screen.getByText('Close');
      closeButton.click();

      const inputToFocus = getByTestId('input-to-focus');

      await waitFor(() => {
        expect(inputToFocus).toHaveFocus();
      });
    });
  });
});
