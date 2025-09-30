import { createRenderer, describeConformance } from '#test-utils';
import { Field } from '@base-ui-components/solid/field';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Field.Label />', () => {
  const { render } = createRenderer();

  describeConformance(Field.Label, () => ({
    refInstanceof: window.HTMLLabelElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Field.Root>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Field.Root>
        ),
        elementProps,
      );
    },
  }));

  it('should set htmlFor referencing the control automatically', () => {
    render(() => (
      <Field.Root data-testid="field">
        <Field.Control />
        <Field.Label data-testid="label">Label</Field.Label>
      </Field.Root>
    ));

    expect(screen.getByTestId('label')).to.have.attribute('for', screen.getByRole('textbox').id);
  });
});
