import { createRenderer, describeConformance } from '#test-utils';
import { Menu } from '@base-ui-components/solid/menu';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';

describe('<Menu.RadioGroup />', () => {
  const { render } = createRenderer();

  describeConformance(Menu.RadioGroup, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `group` role', async () => {
    render(() => <Menu.RadioGroup />);
    expect(screen.getByRole('group')).toBeVisible();
  });
});
