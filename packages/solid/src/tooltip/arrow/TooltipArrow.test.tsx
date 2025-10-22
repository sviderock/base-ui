import { createRenderer, describeConformance } from '#test-utils';
import { Tooltip } from '@base-ui-components/solid/tooltip';
import { Dynamic } from 'solid-js/web';

describe('<Tooltip.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(Tooltip.Arrow, () => ({
    refInstanceof: window.Element,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Tooltip.Root open>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>
                  <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        ),
        elementProps,
      );
    },
  }));
});
