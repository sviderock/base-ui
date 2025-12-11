import { createRenderer, describeConformance } from '#test-utils';
import { Select } from '@base-ui-components/solid/select';

describe('<Select.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(Select.Popup, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, props) {
      return render(() => (
        <Select.Root open>
          <Select.Portal>
            <Select.Positioner>{node(props)}</Select.Positioner>
          </Select.Portal>
        </Select.Root>
      ));
    },
  }));
});
