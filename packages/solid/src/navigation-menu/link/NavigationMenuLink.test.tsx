import { createRenderer, describeConformance } from '#test-utils';
import { NavigationMenu } from '@msviderok/base-ui-solid/navigation-menu';

describe('<NavigationMenu.Link />', () => {
  const { render } = createRenderer();

  describeConformance(NavigationMenu.Link, () => ({
    render: (node, props) =>
      render(() => (
        <NavigationMenu.Root>
          <NavigationMenu.List>{node(props)}</NavigationMenu.List>
        </NavigationMenu.Root>
      )),
    refInstanceof: window.HTMLAnchorElement,
  }));
});
