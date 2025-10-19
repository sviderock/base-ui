import { createRenderer, describeConformance } from '#test-utils';
import { PreviewCard } from '@base-ui-components/solid/preview-card';
import { Dynamic } from 'solid-js/web';

describe('<PreviewCard.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(PreviewCard.Trigger, () => ({
    refInstanceof: window.HTMLAnchorElement,
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
});
