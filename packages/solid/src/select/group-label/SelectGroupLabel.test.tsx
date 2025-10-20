import { createRenderer, describeConformance } from '#test-utils';
import { Select } from '@base-ui-components/solid/select';
import { Dynamic } from 'solid-js/web';

describe('<Select.GroupLabel />', () => {
  const { render } = createRenderer();

  describeConformance(Select.GroupLabel, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Select.Root open>
            <Select.Group>
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </Select.Group>
          </Select.Root>
        ),
        elementProps,
      );
    },
  }));
});
