import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Avatar } from '@base-ui-components/solid/avatar';
import { waitFor } from '@solidjs/testing-library';
import { Dynamic } from 'solid-js/web';
import { Mock } from 'vitest';
import { useImageLoadingStatus } from '../image/useImageLoadingStatus';

vi.mock('../image/useImageLoadingStatus');

describe('<Avatar.Fallback />', () => {
  const { render } = createRenderer();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describeConformance(Avatar.Fallback, () => ({
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
    refInstanceof: window.HTMLSpanElement,
  }));

  it.skipIf(!isJSDOM)('should not render the children if the image loaded', async () => {
    (useImageLoadingStatus as Mock).mockReturnValue(() => 'loaded');

    const { queryByTestId } = render(() => (
      <Avatar.Root>
        <Avatar.Image />
        <Avatar.Fallback data-testid="fallback" />
      </Avatar.Root>
    ));

    await waitFor(() => {
      expect(queryByTestId('fallback')).to.equal(null);
    });
  });

  it.skipIf(!isJSDOM)('should render the fallback if the image fails to load', async () => {
    (useImageLoadingStatus as Mock).mockReturnValue(() => 'error');

    const { queryByText } = await render(() => (
      <Avatar.Root>
        <Avatar.Image />
        <Avatar.Fallback>AC</Avatar.Fallback>
      </Avatar.Root>
    ));

    await waitFor(() => {
      expect(queryByText('AC')).not.to.equal(null);
    });
  });

  describe.skipIf(!isJSDOM)('prop: delay', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    it('shows the fallback when the delay has elapsed', async () => {
      (useImageLoadingStatus as Mock).mockReturnValue(() => undefined);

      const { queryByText } = renderFakeTimers(() => (
        <Avatar.Root>
          <Avatar.Image />
          <Avatar.Fallback delay={100}>AC</Avatar.Fallback>
        </Avatar.Root>
      ));

      expect(queryByText('AC')).to.equal(null);

      clock.tick(100);

      expect(queryByText('AC')).to.not.equal(null);
    });
  });
});
