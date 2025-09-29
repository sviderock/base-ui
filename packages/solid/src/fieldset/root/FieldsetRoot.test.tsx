import { createRenderer, describeConformance } from '#test-utils';
import { Fieldset } from '@base-ui-components/solid/fieldset';

describe('<Fieldset.Root />', () => {
  const { render } = createRenderer();

  describeConformance(Fieldset.Root, () => ({
    inheritComponent: 'fieldset',
    refInstanceof: window.HTMLFieldSetElement,
    render,
  }));
});
