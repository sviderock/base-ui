import { createRenderer, describeConformance } from '#test-utils';
import { Avatar } from '@base-ui-components/solid/avatar';
import { Dynamic } from 'solid-js/web';

describe('<Avatar.Image />', () => {
  const { render } = createRenderer();
  vi.mock('./useImageLoadingStatus', () => ({
    useImageLoadingStatus: () => () => 'loaded',
  }));

  describeConformance(Avatar.Image, () => ({
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <Avatar.Root>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Avatar.Root>
        ),
        elementProps,
      );
    },
    refInstanceof: window.HTMLImageElement,
  }));
});
