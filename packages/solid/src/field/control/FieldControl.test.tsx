import { createRenderer, describeConformance } from '#test-utils';
import { Field } from '@base-ui-components/solid/field';

describe('<Field.Control />', () => {
  const { render } = createRenderer();

  describeConformance(Field.Control, () => ({
    refInstanceof: window.HTMLInputElement,
    render: (node, props) => render(() => <Field.Root>{node(props)}</Field.Root>),
  }));
});
