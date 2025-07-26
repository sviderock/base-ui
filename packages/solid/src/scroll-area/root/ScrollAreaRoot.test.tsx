import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { ScrollArea } from '@base-ui-components/solid/scroll-area';
import { screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';

const VIEWPORT_SIZE = 200;
const SCROLLABLE_CONTENT_SIZE = 1000;
const SCROLLBAR_WIDTH = 10;
const SCROLLBAR_HEIGHT = 10;

describe('<ScrollArea.Root />', () => {
  const { render } = createRenderer();

  describeConformance(ScrollArea.Root, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe.skipIf(isJSDOM)('sizing', () => {
    it('should correctly set thumb height and width based on scrollable content', async () => {
      render(() => (
        <ScrollArea.Root style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div
              style={{
                width: `${SCROLLABLE_CONTENT_SIZE}px`,
                height: `${SCROLLABLE_CONTENT_SIZE}px`,
              }}
            />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical-scrollbar">
            <ScrollArea.Thumb data-testid="vertical-thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal" data-testid="horizontal-scrollbar">
            <ScrollArea.Thumb data-testid="horizontal-thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      await waitFor(() => {
        const verticalThumb = screen.getByTestId('vertical-thumb');
        const horizontalThumb = screen.getByTestId('horizontal-thumb');

        expect(
          getComputedStyle(verticalThumb).getPropertyValue('--scroll-area-thumb-height'),
        ).to.equal(`${(VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE) * VIEWPORT_SIZE}px`);
        // eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
        expect(
          getComputedStyle(horizontalThumb).getPropertyValue('--scroll-area-thumb-width'),
        ).to.equal(`${(VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE) * VIEWPORT_SIZE}px`);
      });
    });

    it('should not add padding for overlay scrollbars', async () => {
      render(() => (
        <ScrollArea.Root style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div
              style={{
                width: `${SCROLLABLE_CONTENT_SIZE}px`,
                height: `${SCROLLABLE_CONTENT_SIZE}px`,
              }}
            />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            style={{ width: `${SCROLLBAR_WIDTH}px`, height: '100%' }}
          />
          <ScrollArea.Scrollbar
            orientation="horizontal"
            style={{ height: `${SCROLLBAR_HEIGHT}px`, width: '100%' }}
          />
        </ScrollArea.Root>
      ));

      await waitFor(() => {
        const contentWrapper = screen.getByTestId('viewport').firstElementChild!;
        const style = getComputedStyle(contentWrapper);

        expect(style.paddingLeft).to.equal('0px');
        expect(style.paddingRight).to.equal('0px');
        expect(style.paddingBottom).to.equal('0px');
      });
    });

    it('accounts for scrollbar padding', async () => {
      const PADDING = 8;

      render(() => (
        <ScrollArea.Root style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div
              style={{
                width: `${SCROLLABLE_CONTENT_SIZE}px`,
                height: `${SCROLLABLE_CONTENT_SIZE}px`,
              }}
            />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            data-testid="vertical-scrollbar"
            style={{ 'padding-block': `${PADDING}px` }}
          >
            <ScrollArea.Thumb data-testid="vertical-thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar
            orientation="horizontal"
            data-testid="horizontal-scrollbar"
            style={{ 'padding-inline': `${PADDING}px` }}
          >
            <ScrollArea.Thumb data-testid="horizontal-thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      await waitFor(() => {
        const verticalThumb = screen.getByTestId('vertical-thumb');
        const horizontalThumb = screen.getByTestId('horizontal-thumb');

        expect(
          getComputedStyle(verticalThumb).getPropertyValue('--scroll-area-thumb-height'),
        ).to.equal(
          `${(VIEWPORT_SIZE - PADDING * 2) * (VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE)}px`,
        );
        // eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
        expect(
          getComputedStyle(horizontalThumb).getPropertyValue('--scroll-area-thumb-width'),
        ).to.equal(
          `${(VIEWPORT_SIZE - PADDING * 2) * (VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE)}px`,
        );
      });
    });

    it('accounts for scrollbar margin', async () => {
      const margin = 11;
      const viewportSize = 390;

      render(() => (
        <ScrollArea.Root style={{ width: `${viewportSize}px`, height: `${viewportSize}px` }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div
              style={{
                width: `${SCROLLABLE_CONTENT_SIZE}px`,
                height: `${SCROLLABLE_CONTENT_SIZE}px`,
              }}
            />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            data-testid="vertical-scrollbar"
            style={{ 'margin-inline': `${margin}px` }}
          >
            <ScrollArea.Thumb data-testid="vertical-thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar
            orientation="horizontal"
            data-testid="horizontal-scrollbar"
            style={{ 'margin-block': `${margin}px` }}
          >
            <ScrollArea.Thumb data-testid="horizontal-thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      await waitFor(() => {
        const verticalThumb = screen.getByTestId('vertical-thumb');
        const horizontalThumb = screen.getByTestId('horizontal-thumb');

        expect(
          getComputedStyle(verticalThumb).getPropertyValue('--scroll-area-thumb-height'),
        ).to.equal(`${viewportSize * (viewportSize / SCROLLABLE_CONTENT_SIZE)}px`);
        // eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
        expect(
          getComputedStyle(horizontalThumb).getPropertyValue('--scroll-area-thumb-width'),
        ).to.equal(`${viewportSize * (viewportSize / SCROLLABLE_CONTENT_SIZE)}px`);
      });
    });

    it('accounts for thumb margin', async () => {
      const MARGIN = 8;

      render(() => (
        <ScrollArea.Root style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div
              style={{
                width: `${SCROLLABLE_CONTENT_SIZE}px`,
                height: `${SCROLLABLE_CONTENT_SIZE}px`,
              }}
            />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical-scrollbar">
            <ScrollArea.Thumb
              data-testid="vertical-thumb"
              style={{ 'margin-block': `${MARGIN}px` }}
            />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal" data-testid="horizontal-scrollbar">
            <ScrollArea.Thumb
              data-testid="horizontal-thumb"
              style={{ 'margin-inline': `${MARGIN}px` }}
            />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      await waitFor(() => {
        const verticalThumb = screen.getByTestId('vertical-thumb');
        const horizontalThumb = screen.getByTestId('horizontal-thumb');

        expect(
          getComputedStyle(verticalThumb).getPropertyValue('--scroll-area-thumb-height'),
        ).to.equal(`${(VIEWPORT_SIZE - MARGIN * 2) * (VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE)}px`);
        // eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
        expect(
          getComputedStyle(horizontalThumb).getPropertyValue('--scroll-area-thumb-width'),
        ).to.equal(`${(VIEWPORT_SIZE - MARGIN * 2) * (VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE)}px`);
      });
    });
  });
});
