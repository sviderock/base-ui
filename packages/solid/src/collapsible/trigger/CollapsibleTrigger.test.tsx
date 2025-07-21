import { createRenderer, describeConformance } from '#test-utils';
import { Collapsible } from '@base-ui-components/solid/collapsible';
import { Dynamic } from 'solid-js/web';

describe('<Collapsible.Trigger />', () => {
  const { render } = createRenderer();
  describeConformance(Collapsible.Trigger, () => ({
    inheritComponent: 'button',
    render(node, elementProps = {}) {
      return render(
        () => (
          <Collapsible.Root>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Collapsible.Root>
        ),
        elementProps,
      );
    },
    refInstanceof: window.HTMLButtonElement,
  }));
});
