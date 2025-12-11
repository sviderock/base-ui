import { createRenderer, describeConformance } from '#test-utils';
import { Select } from '@base-ui-components/solid/select';

describe('<Select.GroupLabel />', () => {
  const { render } = createRenderer();

  describeConformance(Select.GroupLabel, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, props) {
      return render(() => (
        <Select.Root open>
          <Select.Group>{node(props)}</Select.Group>
        </Select.Root>
      ));
    },
  }));
});
