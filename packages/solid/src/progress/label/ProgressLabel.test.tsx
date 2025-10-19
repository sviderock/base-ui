import { createRenderer, describeConformance } from '#test-utils';
import { Progress } from '@base-ui-components/solid/progress';
import { Dynamic } from 'solid-js/web';

describe('<Progress.Label />', () => {
  const { render } = createRenderer();

  describeConformance(Progress.Label, () => ({
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <Progress.Root value={40}>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Progress.Root>
        ),
        elementProps,
      );
    },
    refInstanceof: window.HTMLSpanElement,
  }));
});
