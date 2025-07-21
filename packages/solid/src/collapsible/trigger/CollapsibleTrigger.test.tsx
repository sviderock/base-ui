import { createRenderer, describeConformance } from '#test-utils';
import { Collapsible } from '@base-ui-components/solid/collapsible';

describe('<Collapsible.Trigger />', () => {
  const { render } = createRenderer();
  describeConformance(Collapsible.Trigger, () => ({
    inheritComponent: 'button',

    render: (node, elementProps) => {
      const { container, ...other } = render(node, elementProps, {
        wrapper: (props) => <Collapsible.Root>{props.children}</Collapsible.Root>,
      });

      return { container, ...other };
    },
    refInstanceof: window.HTMLButtonElement,
  }));
});
