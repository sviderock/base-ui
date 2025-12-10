import { createRenderer, describeConformance } from '#test-utils';
import { Accordion } from '@base-ui-components/solid/accordion';

describe('<Accordion.Header />', () => {
  const { render } = createRenderer();

  describeConformance(Accordion.Header, () => ({
    render: (node, props) =>
      render(() => (
        <Accordion.Root>
          <Accordion.Item>{node(props)}</Accordion.Item>
        </Accordion.Root>
      )),
    refInstanceof: window.HTMLHeadingElement,
  }));
});
