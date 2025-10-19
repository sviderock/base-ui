import { createRenderer, describeConformance } from '#test-utils';
import { NumberField } from '@base-ui-components/solid/number-field';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<NumberField.Group />', () => {
  const { render } = createRenderer();

  describeConformance(NumberField.Group, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <NumberField.Root>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </NumberField.Root>
        ),
        elementProps,
      );
    },
  }));

  it('has role prop', () => {
    render(() => (
      <NumberField.Root>
        <NumberField.Group />
      </NumberField.Root>
    ));
    expect(screen.queryByRole('group')).not.to.equal(null);
  });
});
