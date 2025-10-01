import { createRenderer, describeConformance } from '#test-utils';
import { Field } from '@base-ui-components/solid/field';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Field.Description />', () => {
  const { render } = createRenderer();

  describeConformance(Field.Description, () => ({
    refInstanceof: window.HTMLParagraphElement,
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

  it('should set aria-describedby on the control automatically', () => {
    render(() => (
      <Field.Root>
        <Field.Control />
        <Field.Description>Message</Field.Description>
      </Field.Root>
    ));

    expect(screen.getByRole('textbox')).to.have.attribute(
      'aria-describedby',
      screen.getByText('Message').id,
    );
  });
});
