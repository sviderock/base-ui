import { createRenderer, describeConformance } from '#test-utils';
import { AlertDialog } from '@base-ui-components/solid/alert-dialog';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Dynamic } from 'solid-js/web';

describe('<AlertDialog.Close />', () => {
  const { render } = createRenderer();

  describeConformance(AlertDialog.Close, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <AlertDialog.Root open>
            <AlertDialog.Backdrop />
            <AlertDialog.Portal>
              <AlertDialog.Popup>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        ),
        elementProps,
      );
    },
  }));

  describe('prop: disabled', () => {
    it('disables the button', async () => {
      const handleOpenChange = spy();

      const { user } = render(() => (
        <AlertDialog.Root onOpenChange={handleOpenChange}>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Close disabled>Close</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
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
        <AlertDialog.Root onOpenChange={handleOpenChange}>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Close disabled render="span" nativeButton={false}>
                Close
              </AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
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
});
