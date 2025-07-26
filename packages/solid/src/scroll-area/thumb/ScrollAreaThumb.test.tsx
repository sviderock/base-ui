import { createRenderer, describeConformance } from '#test-utils';
import { ScrollArea } from '@base-ui-components/solid/scroll-area';
import { Dynamic } from 'solid-js/web';

describe('<ScrollArea.Thumb />', () => {
  const { render } = createRenderer();

  describeConformance(ScrollArea.Thumb, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <ScrollArea.Root>
            <ScrollArea.Scrollbar>
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        ),
        elementProps,
      );
    },
  }));
});
