import { createRenderer, describeConformance } from '#test-utils';
import { Popover } from '@base-ui-components/solid/popover';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Popover.Description />', () => {
  const { render } = createRenderer();

  describeConformance(Popover.Description, () => ({
    refInstanceof: window.HTMLParagraphElement,
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

  it('describes the popup element with its id', async () => {
    render(() => (
      <Popover.Root open>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Description>Title</Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ));

    const id = document.querySelector('p')?.id;
    expect(screen.getByRole('dialog')).to.have.attribute('aria-describedby', id);
  });
});
