import { createRenderer, describeConformance } from '#test-utils';
import { Input } from '@base-ui-components/solid/input';

describe('<Input />', () => {
  const { render } = createRenderer();

  describeConformance(Input, () => ({
    refInstanceof: window.HTMLInputElement,
    render,
  }));
});
