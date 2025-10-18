import { createRenderer, describeConformance } from '#test-utils';
import { NavigationMenu } from '@base-ui-components/solid/navigation-menu';
import { Dynamic } from 'solid-js/web';

describe('<NavigationMenu.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(NavigationMenu.Backdrop, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <NavigationMenu.Root>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </NavigationMenu.Root>
        ),
        elementProps,
      );
    },
  }));
});
