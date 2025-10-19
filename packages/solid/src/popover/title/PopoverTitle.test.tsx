import { createRenderer, describeConformance } from '#test-utils';
import { Popover } from '@base-ui-components/solid/popover';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Popover.Title />', () => {
  const { render } = createRenderer();

  describeConformance(Popover.Title, () => ({
    refInstanceof: window.HTMLHeadingElement,
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

  it('labels the popup element with its id', async () => {
    render(() => (
      <Popover.Root open>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Title>Title</Popover.Title>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ));

    const id = document.querySelector('h2')?.id;
    expect(screen.getByRole('dialog')).to.have.attribute('aria-labelledby', id);
  });
});
