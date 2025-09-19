import { createRenderer, describeConformance } from '#test-utils';
import { Dialog } from '@base-ui-components/solid/dialog';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Dynamic } from 'solid-js/web';

describe('<Dialog.Close />', () => {
  const { render } = createRenderer();

  describeConformance(Dialog.Close, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <Dialog.Root open modal={false}>
            <Dialog.Portal>
              <Dialog.Popup>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        ),
        elementProps,
      );
    },
  }));

  describe('prop: disabled', () => {
    it('disables the button', async () => {
      const handleOpenChange = spy();

      const { user } = render(() => (
        <Dialog.Root onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close disabled>Close</Dialog.Close>
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
      expect(closeButton).to.have.attribute('disabled');
      expect(closeButton).to.have.attribute('data-disabled');
      await user.click(closeButton);

      expect(handleOpenChange.callCount).to.equal(1);
    });

    it('custom element', async () => {
      const handleOpenChange = spy();

      const { user } = render(() => (
        <Dialog.Root onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close disabled render={(props) => <span {...props} />} nativeButton={false}>
                Close
              </Dialog.Close>
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
      expect(closeButton).to.not.have.attribute('disabled');
      expect(closeButton).to.have.attribute('data-disabled');
      expect(closeButton).to.have.attribute('aria-disabled', 'true');
      await user.click(closeButton);

      expect(handleOpenChange.callCount).to.equal(1);
    });
  });

  it('closes the dialog when undefined is passed to the `onClick` prop', async () => {
    const handleOpenChange = spy();

    const { user } = render(() => (
      <Dialog.Root onOpenChange={handleOpenChange}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Close onClick={undefined}>Close</Dialog.Close>
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
});
