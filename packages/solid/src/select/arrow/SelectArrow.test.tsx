import { createRenderer, describeConformance } from '#test-utils';
import { Select } from '@base-ui-components/solid/select';
import { Dynamic } from 'solid-js/web';

describe('<Select.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(Select.Arrow, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Select.Root open>
            <Select.Positioner alignItemWithTrigger={false}>
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </Select.Positioner>
          </Select.Root>
        ),
        elementProps,
      );
    },
  }));
});
