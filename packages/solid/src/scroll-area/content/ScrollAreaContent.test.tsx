import { createRenderer, describeConformance } from '#test-utils';
import { ScrollArea } from '@base-ui-components/solid/scroll-area';
import { Dynamic } from 'solid-js/web';

describe('<ScrollArea.Content />', () => {
  const { render } = createRenderer();

  describeConformance(ScrollArea.Content, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <ScrollArea.Root>
            <ScrollArea.Viewport>
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </ScrollArea.Viewport>
          </ScrollArea.Root>
        ),
        elementProps,
      );
    },
  }));
});
