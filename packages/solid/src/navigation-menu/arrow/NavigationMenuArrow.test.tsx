import { createRenderer, describeConformance } from '#test-utils';
import { NavigationMenu } from '@base-ui-components/solid/navigation-menu';
import { Dynamic } from 'solid-js/web';

describe('<NavigationMenu.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(NavigationMenu.Arrow, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <NavigationMenu.Root value="test">
            <NavigationMenu.Portal>
              <NavigationMenu.Positioner>
                <NavigationMenu.Popup>
                  <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
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
