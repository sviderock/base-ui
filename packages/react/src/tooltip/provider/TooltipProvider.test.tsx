import { createRenderer } from '#test-utils';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import * as React from 'react';
import { OPEN_DELAY } from '../utils/constants';

describe('<Tooltip.Provider />', () => {
  const { render, clock } = createRenderer();

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('waits for the delay before showing the tooltip', async () => {
      await render(
        <Tooltip.Provider delay={10_000}>
          <Tooltip.Root>
            <Tooltip.Trigger />
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>,
      );

      console.log(1);
      const trigger = screen.getByRole('button');

      console.log(2);
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      console.log(3);
      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(1_000);

      console.log(4);
      expect(screen.queryByText('Content')).to.equal(null);

      console.log(5);
      clock.tick(9_000);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).not.to.equal(null);
    });

    it('respects delay=0', async () => {
      await render(
        <Tooltip.Provider delay={0}>
          <Tooltip.Root>
            <Tooltip.Trigger />
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(0);

      expect(screen.queryByText('Content')).not.to.equal(null);
    });

    it('respects root delay prop over provider delay prop', async () => {
      await render(
        <Tooltip.Provider delay={10}>
          <Tooltip.Root delay={100}>
            <Tooltip.Trigger />
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(99);

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(1);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).not.to.equal(null);
    });
  });

  describe('prop: closeDelay', () => {
    clock.withFakeTimers();

    it('waits for the closeDelay before hiding the tooltip', async () => {
      await render(
        <Tooltip.Provider closeDelay={400}>
          <Tooltip.Root>
            <Tooltip.Trigger />
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(trigger);

      clock.tick(300);

      expect(screen.queryByText('Content')).not.to.equal(null);

      clock.tick(300);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });
});
