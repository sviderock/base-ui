import { createRenderer, describeConformance } from '#test-utils';
import { Popover } from '@base-ui-components/solid/popover';
import { screen, waitFor } from '@solidjs/testing-library';
import { Dynamic } from 'solid-js/web';

describe('<Popover.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(Popover.Backdrop, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Popover.Root open>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Popover.Root>
        ),
        elementProps,
      );
    },
  }));

  it('sets `pointer-events: none` style on backdrop if opened by hover', async () => {
    const { user } = render(() => (
      <Popover.Root delay={0} openOnHover>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Backdrop data-testid="backdrop" />
          <Popover.Positioner>
            <Popover.Popup />
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ));

    await user.hover(screen.getByText('Open'));

    expect(screen.getByTestId('backdrop').style.pointerEvents).to.equal('none');
  });

  it('does not set `pointer-events: none` style on backdrop if opened by click', async () => {
    const { user } = render(() => (
      <Popover.Root openOnHover>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Backdrop data-testid="backdrop" />
          <Popover.Positioner>
            <Popover.Popup />
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ));

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByTestId('backdrop').style.pointerEvents).not.to.equal('none');
    });
  });
});
