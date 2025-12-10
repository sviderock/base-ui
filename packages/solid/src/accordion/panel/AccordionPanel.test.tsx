import { createRenderer, describeConformance } from '#test-utils';
import { Accordion } from '@base-ui-components/solid/accordion';

describe('<Accordion.Panel />', () => {
  const { render } = createRenderer();

  describeConformance(
    (props) => <Accordion.Panel keepMounted {...props} ref={props.ref} />,
    () => ({
      render: (node, props) =>
        render(() => (
          <Accordion.Root>
            <Accordion.Item>{node(props)}</Accordion.Item>
          </Accordion.Root>
        )),
      refInstanceof: window.HTMLDivElement,
    }),
  );
});
