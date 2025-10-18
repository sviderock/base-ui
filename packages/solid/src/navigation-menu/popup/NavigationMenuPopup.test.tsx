import { createRenderer, describeConformance } from '#test-utils';
import { NavigationMenu } from '@base-ui-components/solid/navigation-menu';
import { Dynamic } from 'solid-js/web';

describe('<NavigationMenu.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(NavigationMenu.Popup, () => ({
    refInstanceof: window.HTMLElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <NavigationMenu.Root value="test">
            <NavigationMenu.Portal>
              <NavigationMenu.Positioner>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </NavigationMenu.Positioner>
            </NavigationMenu.Portal>
          </NavigationMenu.Root>
        ),
        elementProps,
      );
    },
  }));
});
