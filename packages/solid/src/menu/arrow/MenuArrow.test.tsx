import { createRenderer, describeConformance } from '#test-utils';
import { Menu } from '@base-ui-components/solid/menu';
import { Dynamic } from 'solid-js/web';

describe('<Menu.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(Menu.Arrow, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        ),
        elementProps,
      );
    },
  }));
});
