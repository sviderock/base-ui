import { createRenderer, describeConformance } from '#test-utils';
import { Popover } from '@base-ui-components/solid/popover';
import { Dynamic } from 'solid-js/web';

describe('<Popover.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(Popover.Arrow, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Popover.Root open>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>
                  <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        ),
        elementProps,
      );
    },
  }));
});
