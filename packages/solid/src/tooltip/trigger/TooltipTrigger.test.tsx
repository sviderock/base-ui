import { createRenderer, describeConformance } from '#test-utils';
import { Tooltip } from '@base-ui-components/solid/tooltip';
import { Dynamic } from 'solid-js/web';

describe('<Tooltip.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(Tooltip.Trigger, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Tooltip.Root>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Tooltip.Root>
        ),
        elementProps,
      );
    },
  }));
});
