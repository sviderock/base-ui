import { createRenderer, describeConformance } from '#test-utils';
import { PreviewCard } from '@base-ui-components/solid/preview-card';

describe('<PreviewCard.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(PreviewCard.Trigger, () => ({
    render: (node, props) => render(() => <PreviewCard.Root open>{node(props)}</PreviewCard.Root>),
    refInstanceof: window.HTMLAnchorElement,
  }));
});
