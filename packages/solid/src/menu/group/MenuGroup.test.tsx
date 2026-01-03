import { createRenderer, describeConformance } from '#test-utils';
import { Menu } from '@msviderok/base-ui-solid/menu';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';

describe('<Menu.Group />', () => {
  const { render } = createRenderer();

  describeConformance(Menu.Group, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `group` role', async () => {
    render(() => <Menu.Group />);
    expect(screen.getByRole('group')).toBeVisible();
  });
});
