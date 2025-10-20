import { createRenderer, describeConformance } from '#test-utils';
import { Select } from '@base-ui-components/solid/select';
import { Dynamic } from 'solid-js/web';

describe('<Select.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(Select.Popup, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Select.Root open>
            <Select.Portal>
              <Select.Positioner>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        ),
        elementProps,
      );
    },
  }));
});
