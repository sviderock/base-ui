import { createRenderer, describeConformance } from '#test-utils';
import { AlertDialog } from '@base-ui-components/solid/alert-dialog';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<AlertDialog.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(AlertDialog.Trigger, () => ({
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
          <AlertDialog.Trigger
            disabled
            render={(props) => <span {...props} />}
            nativeButton={false}
          />
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
