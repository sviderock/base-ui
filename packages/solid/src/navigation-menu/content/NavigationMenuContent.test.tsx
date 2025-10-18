import { createRenderer, describeConformance } from '#test-utils';
import { NavigationMenu } from '@base-ui-components/solid/navigation-menu';
import { Dynamic } from 'solid-js/web';

describe('<NavigationMenu.Content />', () => {
  const { render } = createRenderer();

  describeConformance.skip(NavigationMenu.Content, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <NavigationMenu.Root value="test">
            <NavigationMenu.Item>
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </NavigationMenu.Item>
            <NavigationMenu.Portal>
              <NavigationMenu.Positioner>
                <NavigationMenu.Popup>
                  <NavigationMenu.Viewport />
                </NavigationMenu.Popup>
              </NavigationMenu.Positioner>
            </NavigationMenu.Portal>
          </NavigationMenu.Root>
        ),
        elementProps,
      );
    },
  }));
});
