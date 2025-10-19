import { createRenderer, describeConformance } from '#test-utils';
import { PreviewCard } from '@base-ui-components/solid/preview-card';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Popover.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(PreviewCard.Popup, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <PreviewCard.Root open>
            <PreviewCard.Portal>
              <PreviewCard.Positioner>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        ),
        elementProps,
      );
    },
  }));

  it('should render the children', async () => {
    render(() => (
      <PreviewCard.Root open>
        <PreviewCard.Portal>
          <PreviewCard.Positioner>
            <PreviewCard.Popup>Content</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
    ));

    expect(screen.getByText('Content')).not.to.equal(null);
  });
});
