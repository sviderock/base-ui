'use client';
import type { JSX } from 'solid-js';
import { createMemo } from 'solid-js/types/server/reactive.js';
import { FloatingDelayGroup } from '../../floating-ui-solid';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { TooltipProviderContext } from './TooltipProviderContext';

/**
 * Provides a shared delay for multiple tooltips. The grouping logic ensures that
 * once a tooltip becomes visible, the adjacent tooltips will be shown instantly.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export function TooltipProvider(props: TooltipProvider.Props) {
  const delay = () => access(props.delay);
  const closeDelay = () => access(props.closeDelay);
  const timeout = () => access(props.timeout) ?? 400;

  const contextValue: TooltipProviderContext = {
    delay,
    closeDelay,
  };

  const delayValue = createMemo(() => ({ open: delay(), close: closeDelay() }));

  return (
    <TooltipProviderContext.Provider value={contextValue}>
      <FloatingDelayGroup delay={delayValue()} timeoutMs={timeout()}>
        {props.children}
      </FloatingDelayGroup>
    </TooltipProviderContext.Provider>
  );
}

export namespace TooltipProvider {
  export interface Props {
    children?: JSX.Element;
    /**
     * How long to wait before opening a tooltip. Specified in milliseconds.
     */
    delay?: MaybeAccessor<number | undefined>;
    /**
     * How long to wait before closing a tooltip. Specified in milliseconds.
     */
    closeDelay?: MaybeAccessor<number | undefined>;
    /**
     * Another tooltip will open instantly if the previous tooltip
     * is closed within this timeout. Specified in milliseconds.
     * @default 400
     */
    timeout?: MaybeAccessor<number | undefined>;
  }
}
