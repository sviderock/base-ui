import { createRenderer, describeConformance } from '#test-utils';
import { Select } from '@base-ui-components/solid/select';
import { Dynamic } from 'solid-js/web';

describe('<Select.ItemText />', () => {
  const { render } = createRenderer();

  describeConformance(Select.ItemText, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Select.Root open>
            <Select.Positioner>
              <Select.Item value="">
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
