import { createRenderer, describeConformance } from '#test-utils';
import { NavigationMenu } from '@base-ui-components/solid/navigation-menu';

describe('<NavigationMenu.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(NavigationMenu.Backdrop, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node, props) => render(() => <NavigationMenu.Root>{node(props)}</NavigationMenu.Root>),
  }));
});
