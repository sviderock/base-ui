import { createRenderer, describeConformance } from '#test-utils';
import { PreviewCard } from '@base-ui-components/solid/preview-card';
import { screen } from '@solidjs/testing-library';
import { Dynamic } from 'solid-js/web';

describe('<PreviewCard.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(PreviewCard.Backdrop, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <PreviewCard.Root open>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </PreviewCard.Root>
        ),
        elementProps,
      );
    },
  }));

  it('sets `pointer-events: none` style', async () => {
    const { user } = render(() => (
      <PreviewCard.Root delay={0} closeDelay={0}>
        <PreviewCard.Trigger>Open</PreviewCard.Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Backdrop data-testid="backdrop" />
          <PreviewCard.Positioner>
            <PreviewCard.Popup />
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
    ));

    await user.hover(screen.getByText('Open'));

    expect(screen.getByTestId('backdrop').style.pointerEvents).to.equal('none');
  });
});
