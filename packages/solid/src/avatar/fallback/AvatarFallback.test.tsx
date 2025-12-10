import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Avatar } from '@base-ui-components/solid/avatar';
import { screen, waitFor } from '@solidjs/testing-library';
import { Mock } from 'vitest';
import { useImageLoadingStatus } from '../image/useImageLoadingStatus';

vi.mock('../image/useImageLoadingStatus');

describe('<Avatar.Fallback />', () => {
  const { render } = createRenderer();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describeConformance(Avatar.Fallback, () => ({
    render: (node, props) => render(() => <Avatar.Root>{node(props)}</Avatar.Root>),
    refInstanceof: window.HTMLSpanElement,
  }));

  it.skipIf(!isJSDOM)('should not render the children if the image loaded', async () => {
    (useImageLoadingStatus as Mock).mockReturnValue(() => 'loaded');

    render(() => (
      <Avatar.Root>
        <Avatar.Image />
        <Avatar.Fallback data-testid="fallback" />
      </Avatar.Root>
    ));

    await waitFor(() => {
      expect(screen.queryByTestId('fallback')).to.equal(null);
    });
  });

  it.skipIf(!isJSDOM)('should render the fallback if the image fails to load', async () => {
    (useImageLoadingStatus as Mock).mockReturnValue(() => 'error');

    render(() => (
      <Avatar.Root>
        <Avatar.Image />
        <Avatar.Fallback>AC</Avatar.Fallback>
      </Avatar.Root>
    ));

    await waitFor(() => {
      expect(screen.queryByText('AC')).not.to.equal(null);
    });
  });

  describe.skipIf(!isJSDOM)('prop: delay', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    it('shows the fallback when the delay has elapsed', async () => {
      (useImageLoadingStatus as Mock).mockReturnValue(() => undefined);

      renderFakeTimers(() => (
        <Avatar.Root>
          <Avatar.Image />
          <Avatar.Fallback delay={100}>AC</Avatar.Fallback>
        </Avatar.Root>
      ));

      expect(screen.queryByText('AC')).to.equal(null);

      clock.tick(100);

      expect(screen.queryByText('AC')).to.not.equal(null);
    });
  });
});
