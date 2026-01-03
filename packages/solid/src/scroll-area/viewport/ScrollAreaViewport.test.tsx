import { createRenderer, describeConformance } from '#test-utils';
import { ScrollArea } from '@msviderok/base-ui-solid/scroll-area';

describe('<ScrollArea.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(ScrollArea.Viewport, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, props) {
      return render(() => <ScrollArea.Root>{node(props)}</ScrollArea.Root>);
    },
  }));
});
