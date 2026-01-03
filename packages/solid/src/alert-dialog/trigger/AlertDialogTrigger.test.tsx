import { createRenderer, describeConformance } from '#test-utils';
import { AlertDialog } from '@msviderok/base-ui-solid/alert-dialog';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';

describe('<AlertDialog.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(AlertDialog.Trigger, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node, props) =>
      render(() => (
        <AlertDialog.Root open>
          <AlertDialog.Backdrop />
          <AlertDialog.Portal>
            <AlertDialog.Popup>{node(props)}</AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      )),
  }));

  describe('prop: disabled', () => {
    it('disables the dialog', async () => {
      const { user } = render(() => (
        <AlertDialog.Root>
          <AlertDialog.Trigger disabled />
          <AlertDialog.Portal>
            <AlertDialog.Backdrop />
            <AlertDialog.Popup>
              <AlertDialog.Title>title text</AlertDialog.Title>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
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
        <AlertDialog.Root>
          <AlertDialog.Trigger disabled render="span" nativeButton={false} />
          <AlertDialog.Portal>
            <AlertDialog.Backdrop />
            <AlertDialog.Popup>
              <AlertDialog.Title>title text</AlertDialog.Title>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      ));

      const trigger = screen.getByRole('button');
      expect(trigger).to.not.have.attribute('disabled');
      expect(trigger).to.have.attribute('data-disabled');
      expect(trigger).to.have.attribute('aria-disabled', 'true');

      await user.click(trigger);
      expect(screen.queryByText('title text')).to.equal(null);

      await user.keyboard('[Tab]');
      expect(document.activeElement).to.not.equal(trigger);
    });
  });
});
