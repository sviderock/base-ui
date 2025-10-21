import { createRenderer, describeConformance } from '#test-utils';
import { Tabs } from '@base-ui-components/solid/tabs';
import { Dynamic } from 'solid-js/web';

describe('<Tabs.Panel />', () => {
  const { render } = createRenderer();

  describeConformance(
    (props) => <Tabs.Panel {...props} ref={props.ref} value="1" />,
    () => ({
      render: (node, elementProps = {}) => {
        return render(
          () => (
            <Tabs.Root>
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </Tabs.Root>
          ),
          elementProps,
        );
      },
      refInstanceof: window.HTMLDivElement,
    }),
  );
});
