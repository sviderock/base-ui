import { createRenderer, describeConformance } from '#test-utils';
import { NavigationMenu } from '@base-ui-components/solid/navigation-menu';
import { Dynamic } from 'solid-js/web';

describe('<NavigationMenu.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(NavigationMenu.Positioner, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <NavigationMenu.Root value="test">
            <NavigationMenu.Portal>
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </NavigationMenu.Portal>
          </NavigationMenu.Root>
        ),
        elementProps,
      );
    },
  }));
});
