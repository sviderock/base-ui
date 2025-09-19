import { createRenderer, describeConformance } from '#test-utils';
import { Dialog } from '@base-ui-components/solid/dialog';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Dialog.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(Dialog.Trigger, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <Dialog.Root open modal={false}>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Dialog.Root>
        ),
        elementProps,
      );
    },
  }));

  describe('prop: disabled', () => {
    it('disables the dialog', async () => {
      const { user } = render(() => (
        <Dialog.Root modal={false}>
          <Dialog.Trigger disabled />
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup>
              <Dialog.Title>title text</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      const trigger = screen.getByRole('button');
      expect(trigger).to.have.attribute('disabled');
      expect(trigger).to.have.attribute('data-disabled');

      await user.click(trigger);
      expect(screen.queryByText('title text')).to.equal(null);

      await user.keyboard('[Tab]');
      expect(document.activeElement).to.not.equal(trigger);
    });

    it('custom element', async () => {
      const { user } = render(() => (
        <Dialog.Root modal={false}>
          <Dialog.Trigger disabled render={(props) => <span {...props} />} nativeButton={false} />
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup>
              <Dialog.Title>title text</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      const trigger = screen.getByRole('button');
      expect(trigger).to.not.have.attribute('disabled');
      expect(trigger).to.have.attribute('data-disabled');
      expect(trigger).to.have.attribute('aria-disabled', 'true');

      await user.click(trigger);
      screen.debug(trigger);
      expect(screen.queryByText('title text')).to.equal(null);

      await user.keyboard('[Tab]');
      expect(document.activeElement).to.not.equal(trigger);
    });
  });
});
