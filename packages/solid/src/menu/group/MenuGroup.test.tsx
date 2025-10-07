import { createRenderer, describeConformance } from '#test-utils';
import { Menu } from '@base-ui-components/solid/menu';
import { expect } from 'chai';

describe('<Menu.Group />', () => {
  const { render } = createRenderer();

  describeConformance(Menu.Group, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `group` role', async () => {
    const { getByRole } = render(() => <Menu.Group />);
    expect(getByRole('group')).toBeVisible();
  });
});
