import { createRenderer, describeConformance } from '#test-utils';
import { Avatar } from '@msviderok/base-ui-solid/avatar';

describe('<Avatar.Root />', () => {
  const { render } = createRenderer();

  describeConformance(Avatar.Root, () => ({
    render,
    refInstanceof: window.HTMLSpanElement,
  }));
});
