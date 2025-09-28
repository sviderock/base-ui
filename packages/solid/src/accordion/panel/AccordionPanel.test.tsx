import { createRenderer, describeConformance } from '#test-utils';
import { Accordion } from '@base-ui-components/solid/accordion';
import { Dynamic } from 'solid-js/web';

describe('<Accordion.Panel />', () => {
  const { render } = createRenderer();

  describeConformance(
    (props) => <Accordion.Panel keepMounted {...props} />,
    () => ({
      render: (node, elementProps = {}) =>
        render(
          () => (
            <Accordion.Root>
              <Accordion.Item>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </Accordion.Item>
            </Accordion.Root>
          ),
          elementProps,
        ),
      refInstanceof: window.HTMLDivElement,
    }),
  );
});
