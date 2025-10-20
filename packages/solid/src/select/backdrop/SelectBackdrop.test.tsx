import { createRenderer, describeConformance } from '#test-utils';
import { Select } from '@base-ui-components/solid/select';
import { Dynamic } from 'solid-js/web';

describe('<Select.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(Select.Backdrop, () => ({
    refInstanceof: window.HTMLDivElement,
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
