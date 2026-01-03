import { createRenderer, describeConformance } from '#test-utils';
import { Dialog } from '@msviderok/base-ui-solid/dialog';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';

describe('<Dialog.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(Dialog.Backdrop, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node, props) =>
      render(() => (
        <Dialog.Root open modal={false}>
          {node(props)}
        </Dialog.Root>
      )),
  }));

  it('has role="presentation"', () => {
    render(() => (
      <Dialog.Root open>
        <Dialog.Backdrop data-testid="backdrop" />
      </Dialog.Root>
    ));

    expect(screen.getByTestId('backdrop')).to.have.attribute('role', 'presentation');
  });
});
