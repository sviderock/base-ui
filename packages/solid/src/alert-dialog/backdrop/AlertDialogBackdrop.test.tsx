import { createRenderer, describeConformance } from '#test-utils';
import { AlertDialog } from '@base-ui-components/solid/alert-dialog';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';

describe('<AlertDialog.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(AlertDialog.Backdrop, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node, props) => render(() => <AlertDialog.Root open>{node(props)}</AlertDialog.Root>),
  }));

  it('has role="presentation"', () => {
    render(() => (
      <AlertDialog.Root open>
        <AlertDialog.Backdrop data-testid="backdrop" />
      </AlertDialog.Root>
    ));

    expect(screen.getByTestId('backdrop')).to.have.attribute('role', 'presentation');
  });
});
