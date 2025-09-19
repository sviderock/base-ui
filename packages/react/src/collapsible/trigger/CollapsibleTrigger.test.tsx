import { Collapsible } from '@base-ui-components/react/collapsible';
import { createRenderer } from '@mui/internal-test-utils';
import * as React from 'react';
import { describeConformance } from '../../../test/describeConformance';

describe('<Collapsible.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Collapsible.Trigger />, () => ({
    inheritComponent: 'button',
    render: (node) => {
      const { container, ...other } = render(<Collapsible.Root>{node}</Collapsible.Root>);

      return { container, ...other };
    },
    refInstanceof: window.HTMLButtonElement,
  }));
});
