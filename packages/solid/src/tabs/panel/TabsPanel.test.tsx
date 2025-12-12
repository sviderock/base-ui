import { createRenderer, describeConformance } from '#test-utils';
import { Tabs } from '@base-ui-components/solid/tabs';

describe('<Tabs.Panel />', () => {
  const { render } = createRenderer();

  describeConformance(
    (props) => <Tabs.Panel {...props} ref={props.ref} value="1" />,
    () => ({
      render: (node, props) => {
        return render(() => <Tabs.Root>{node(props)}</Tabs.Root>);
      },
      refInstanceof: window.HTMLDivElement,
    }),
  );
});
