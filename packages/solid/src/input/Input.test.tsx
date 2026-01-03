import { createRenderer, describeConformance } from '#test-utils';
import { Input } from '@msviderok/base-ui-solid/input';

describe('<Input />', () => {
  const { render } = createRenderer();

  describeConformance(Input, () => ({
    refInstanceof: window.HTMLInputElement,
    render,
  }));
});
