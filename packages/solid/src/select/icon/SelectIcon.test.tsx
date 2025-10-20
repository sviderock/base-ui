import { createRenderer, describeConformance } from '#test-utils';
import { Select } from '@base-ui-components/solid/select';
import { Dynamic } from 'solid-js/web';

describe('<Select.Icon />', () => {
  const { render } = createRenderer();

  describeConformance(Select.Icon, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Select.Root open>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Select.Root>
        ),
        elementProps,
      );
    },
  }));
});
