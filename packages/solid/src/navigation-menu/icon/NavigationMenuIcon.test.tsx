import { createRenderer, describeConformance } from '#test-utils';
import { NavigationMenu } from '@base-ui-components/solid/navigation-menu';
import { Dynamic } from 'solid-js/web';

describe('<NavigationMenu.Icon />', () => {
  const { render } = createRenderer();

  describeConformance(NavigationMenu.Icon, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <NavigationMenu.Root>
            <NavigationMenu.Item>
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </NavigationMenu.Item>
          </NavigationMenu.Root>
        ),
        elementProps,
      );
    },
  }));
});
