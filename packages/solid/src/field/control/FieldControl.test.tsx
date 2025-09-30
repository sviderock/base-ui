import { createRenderer, describeConformance } from '#test-utils';
import { Field } from '@base-ui-components/solid/field';
import { Dynamic } from 'solid-js/web';

describe('<Field.Control />', () => {
  const { render } = createRenderer();

  describeConformance(Field.Control, () => ({
    refInstanceof: window.HTMLInputElement,
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
});
