import { createRenderer, describeConformance } from '#test-utils';
import { Select } from '@base-ui-components/solid/select';
import { Dynamic } from 'solid-js/web';

describe('<Select.ItemIndicator />', () => {
  const { render } = createRenderer();

  describeConformance(Select.ItemIndicator, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Select.Root open>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Positioner>
              <Select.Item>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </Select.Item>
            </Select.Positioner>
          </Select.Root>
        ),
        elementProps,
      );
    },
  }));
});
