import { createRenderer, describeConformance } from '#test-utils';
import { Tabs } from '@base-ui-components/solid/tabs';

describe('<Tabs.Tab />', () => {
  const { render } = createRenderer();

  describeConformance(
    (props) => <Tabs.Tab {...props} ref={props.ref} value="1" />,
    () => ({
      render: (node, props) => {
        return render(() => (
          <Tabs.Root>
            <Tabs.List>
              {node(props)}
            </Tabs.List>
          </Tabs.Root>
        ));
      },
      refInstanceof: window.HTMLButtonElement,
    }),
  );
});
