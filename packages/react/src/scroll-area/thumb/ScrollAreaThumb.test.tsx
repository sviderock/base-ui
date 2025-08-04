import { createRenderer } from '#test-utils';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import * as React from 'react';
import { describeConformance } from '../../../test/describeConformance';

describe('<ScrollArea.Thumb />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Thumb />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <ScrollArea.Root>
          <ScrollArea.Scrollbar>{node}</ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      );
    },
  }));
});
