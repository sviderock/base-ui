import { createRenderer, describeConformance } from '#test-utils';
import { Dialog } from '@base-ui-components/solid/dialog';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Dialog.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(Dialog.Backdrop, () => ({
    refInstanceof: window.HTMLDivElement,
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

  it('has role="presentation"', () => {
    const { getByTestId } = render(() => (
      <Dialog.Root open>
        <Dialog.Backdrop data-testid="backdrop" />
      </Dialog.Root>
    ));

    expect(getByTestId('backdrop')).to.have.attribute('role', 'presentation');
  });
});
