import { createRenderer } from '#test-utils';
import { Collapsible } from '@base-ui-components/solid/collapsible';
import { Dynamic } from 'solid-js/web';
import { describeConformance } from '../../../test/describeConformance';

describe('<Collapsible.Trigger />', () => {
  const { render } = createRenderer();
  describeConformance(Collapsible.Trigger, () => ({
    inheritComponent: 'button',
    render: (node) => {
      const { container, ...other } = render(() => (
        <Collapsible.Root>
          <Dynamic component={node} />
        </Collapsible.Root>
      ));

      console.log(container);
      return { container, ...other };
    },
    refInstanceof: window.HTMLButtonElement,
  }));
});
