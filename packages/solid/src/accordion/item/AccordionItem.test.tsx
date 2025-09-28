import { createRenderer, describeConformance } from '#test-utils';
import { Accordion } from '@base-ui-components/solid/accordion';
import { Dynamic } from 'solid-js/web';
import { NOOP } from '../../utils/noop';
import { AccordionRootContext } from '../root/AccordionRootContext';

const accordionRootContextValue: AccordionRootContext = {
  accordionItemElements: [],
  direction: () => 'ltr',
  disabled: () => false,
  handleValueChange: NOOP,
  hiddenUntilFound: () => false,
  keepMounted: () => false,
  orientation: () => 'vertical',
  state: () => ({
    value: [0],
    disabled: false,
    orientation: 'vertical',
  }),
  value: () => [0],
};

describe('<Accordion.Item />', () => {
  const { render } = createRenderer();

  describeConformance(Accordion.Item, () => ({
    render: (node, elementProps = {}) =>
      render(
        () => (
          <AccordionRootContext.Provider value={accordionRootContextValue}>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </AccordionRootContext.Provider>
        ),
        elementProps,
      ),
    refInstanceof: window.HTMLDivElement,
  }));
});
