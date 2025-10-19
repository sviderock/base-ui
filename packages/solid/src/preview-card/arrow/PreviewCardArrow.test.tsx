import { createRenderer, describeConformance } from '#test-utils';
import { PreviewCard } from '@base-ui-components/solid/preview-card';
import { Dynamic } from 'solid-js/web';

describe('<PreviewCard.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(PreviewCard.Arrow, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <PreviewCard.Root open>
            <PreviewCard.Portal>
              <PreviewCard.Positioner>
                <PreviewCard.Popup>
                  <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        ),
        elementProps,
      );
    },
  }));
});
