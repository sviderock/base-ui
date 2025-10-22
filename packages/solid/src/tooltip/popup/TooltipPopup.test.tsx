import { createRenderer, describeConformance } from '#test-utils';
import { Tooltip } from '@base-ui-components/solid/tooltip';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Tooltip.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(Tooltip.Popup, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Tooltip.Root open>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        ),
        elementProps,
      );
    },
  }));

  it('should render the children', async () => {
    render(() => (
      <Tooltip.Root open>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    expect(screen.getByText('Content')).not.to.equal(null);
  });
});
