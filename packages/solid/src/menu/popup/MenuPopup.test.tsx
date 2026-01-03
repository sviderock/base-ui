import { createRenderer, describeConformance } from '#test-utils';
import { Menu } from '@msviderok/base-ui-solid/menu';
import { screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';

describe('<Menu.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(Menu.Popup, () => ({
    render: (node, props) =>
      render(() => (
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>{node(props)}</Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )),
    refInstanceof: window.HTMLDivElement,
  }));

  describe('prop: finalFocus', () => {
    it('should focus the trigger by default when closed', async () => {
      render(() => (
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
