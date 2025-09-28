import { createRenderer, describeConformance } from '#test-utils';
import { AlertDialog } from '@base-ui-components/solid/alert-dialog';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<AlertDialog.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(AlertDialog.Backdrop, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <AlertDialog.Root open>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </AlertDialog.Root>
        ),
        elementProps,
      );
    },
  }));

  it('has role="presentation"', () => {
    const { getByTestId } = render(() => (
      <AlertDialog.Root open>
        <AlertDialog.Backdrop data-testid="backdrop" />
      </AlertDialog.Root>
    ));

    expect(getByTestId('backdrop')).to.have.attribute('role', 'presentation');
  });
});
