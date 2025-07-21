import { Collapsible } from '@base-ui-components/solid/collapsible';
import { render } from '@solidjs/testing-library';
import { describeConformance } from '../../../test/describeConformance';

describe('<Collapsible.Trigger />', () => {
  describeConformance(<Collapsible.Trigger />, () => ({
    inheritComponent: 'button',
    render: (node) => {
      const { container, ...other } = render(() => <Collapsible.Root>{node}</Collapsible.Root>);

      return { container, ...other };
    },
    refInstanceof: window.HTMLButtonElement,
  }));
});
