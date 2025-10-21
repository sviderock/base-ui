import { createRenderer, describeConformance } from '#test-utils';
import { Tabs } from '@base-ui-components/solid/tabs';
import { Dynamic } from 'solid-js/web';

describe('<Tabs.Tab />', () => {
  const { render } = createRenderer();

  describeConformance(
    (props) => <Tabs.Tab {...props} ref={props.ref} value="1" />,
    () => ({
      render: (node, elementProps = {}) => {
        return render(
          () => (
            <Tabs.Root>
              <Tabs.List>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </Tabs.List>
            </Tabs.Root>
          ),
          elementProps,
        );
      },
      refInstanceof: window.HTMLButtonElement,
    }),
  );
});
