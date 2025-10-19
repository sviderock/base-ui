import { createRenderer, describeConformance } from '#test-utils';
import { Popover } from '@base-ui-components/solid/popover';
import { fireEvent, screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Popover.Close />', () => {
  const { render } = createRenderer();

  describeConformance(Popover.Close, () => ({
    refInstanceof: window.HTMLButtonElement,
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

  it('should close popover when clicked', async () => {
    render(() => (
      <Popover.Root defaultOpen>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              Content
              <Popover.Close data-testid="close" />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ));

    expect(screen.queryByText('Content')).not.to.equal(null);

    fireEvent.click(screen.getByTestId('close'));

    expect(screen.queryByText('Content')).to.equal(null);
  });
});
