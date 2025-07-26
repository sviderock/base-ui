import { createRenderer, describeConformance } from '#test-utils';
import { ScrollArea } from '@base-ui-components/solid/scroll-area';
import { Dynamic } from 'solid-js/web';

describe('<ScrollArea.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(ScrollArea.Viewport, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <ScrollArea.Root>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </ScrollArea.Root>
        ),
        elementProps,
      );
    },
  }));
});
