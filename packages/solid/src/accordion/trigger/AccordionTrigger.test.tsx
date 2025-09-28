import { createRenderer, describeConformance } from '#test-utils';
import { Accordion } from '@base-ui-components/solid/accordion';
import { Dynamic } from 'solid-js/web';

describe('<Accordion.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(Accordion.Trigger, () => ({
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
    refInstanceof: window.HTMLButtonElement,
  }));
});
