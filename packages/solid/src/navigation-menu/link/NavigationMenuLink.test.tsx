import { createRenderer, describeConformance } from '#test-utils';
import { NavigationMenu } from '@base-ui-components/solid/navigation-menu';
import { Dynamic } from 'solid-js/web';

describe('<NavigationMenu.Link />', () => {
  const { render } = createRenderer();

  describeConformance(NavigationMenu.Link, () => ({
    refInstanceof: window.HTMLAnchorElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <NavigationMenu.Root>
            <NavigationMenu.List>
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </NavigationMenu.List>
          </NavigationMenu.Root>
        ),
        elementProps,
      );
    },
  }));
});
