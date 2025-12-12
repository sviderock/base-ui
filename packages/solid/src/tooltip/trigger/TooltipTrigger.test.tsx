import { createRenderer, describeConformance } from '#test-utils';
import { Tooltip } from '@base-ui-components/solid/tooltip';

describe('<Tooltip.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(Tooltip.Trigger, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node, props) {
      return render(() => (
        <Tooltip.Root>
          {node(props)}
        </Tooltip.Root>
      ));
    },
  }));
});
