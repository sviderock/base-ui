'use client';
import { type JSX, Show } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { Side } from '../../utils/useAnchorPositioning';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useTimeout } from '../../utils/useTimeout';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useSelectRootContext } from '../root/SelectRootContext';

/**
 * @internal
 */
export function SelectScrollArrow(componentProps: SelectScrollArrow.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['direction', 'keepMounted']);
  const keepMounted = () => componentProps.keepMounted ?? false;

  const { store, refs, setStore } = useSelectRootContext();
  const { side, alignItemWithTriggerActive } = useSelectPositionerContext();

  const visible = () =>
    local.direction === 'up' ? store.scrollUpArrowVisible : store.scrollDownArrowVisible;

  const timeout = useTimeout();
  let scrollArrowRef = null as HTMLDivElement | null | undefined;

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(visible);

  useOpenChangeComplete({
    open: visible,
    ref: () => scrollArrowRef,
    onComplete() {
      if (!visible()) {
        setMounted(false);
      }
    },
  });

  const state: SelectScrollArrow.State = {
    get direction() {
      return local.direction;
    },
    get visible() {
      return visible();
    },
    get side() {
      return side();
    },
    get transitionStatus() {
      return transitionStatus();
    },
  };

  const defaultProps: JSX.HTMLAttributes<HTMLDivElement> = {
    get hidden() {
      return !mounted();
    },
    'aria-hidden': true,
    get children() {
      return <>{local.direction === 'up' ? '▲' : '▼'}</>;
    },
    style: {
      position: 'absolute',
    },
    onMouseMove(event) {
      if (
        (event.movementX === 0 && event.movementY === 0) ||
        !alignItemWithTriggerActive() ||
        timeout.isStarted()
      ) {
        return;
      }

      setStore('activeIndex', null);

      function scrollNextItem() {
        const popupElement = refs.popupRef;
        if (!popupElement) {
          return;
        }

        setStore('activeIndex', null);

        const isScrolledToTop = popupElement.scrollTop === 0;
        const isScrolledToBottom =
          Math.round(popupElement.scrollTop + popupElement.clientHeight) >=
          popupElement.scrollHeight;

        if (local.direction === 'up') {
          setStore('scrollUpArrowVisible', !isScrolledToTop);
        } else if (local.direction === 'down') {
          setStore('scrollDownArrowVisible', !isScrolledToBottom);
        }

        if (
          (local.direction === 'up' && isScrolledToTop) ||
          (local.direction === 'down' && isScrolledToBottom)
        ) {
          timeout.clear();
          return;
        }

        if (refs.popupRef && refs.listRef && refs.listRef.length > 0) {
          const items = refs.listRef;
          const scrollArrowHeight = scrollArrowRef?.offsetHeight || 0;

          if (local.direction === 'up') {
            let firstVisibleIndex = 0;
            const scrollTop = popupElement.scrollTop + scrollArrowHeight;

            for (let i = 0; i < items.length; i += 1) {
              const item = items[i];
              if (item) {
                const itemTop = item.offsetTop;
                if (itemTop >= scrollTop) {
                  firstVisibleIndex = i;
                  break;
                }
              }
            }

            const targetIndex = Math.max(0, firstVisibleIndex - 1);
            const targetItem = items[targetIndex];
            if (targetIndex < firstVisibleIndex && targetItem) {
              popupElement.scrollTop = targetItem.offsetTop - scrollArrowHeight;
            }
          } else {
            let lastVisibleIndex = items.length - 1;
            const scrollBottom =
              popupElement.scrollTop + popupElement.clientHeight - scrollArrowHeight;

            for (let i = 0; i < items.length; i += 1) {
              const item = items[i];
              if (item) {
                const itemBottom = item.offsetTop + item.offsetHeight;
                if (itemBottom > scrollBottom) {
                  lastVisibleIndex = Math.max(0, i - 1);
                  break;
                }
              }
            }

            const targetIndex = Math.min(items.length - 1, lastVisibleIndex + 1);
            if (targetIndex > lastVisibleIndex) {
              const targetItem = items[targetIndex];
              if (targetItem) {
                popupElement.scrollTop =
                  targetItem.offsetTop +
                  targetItem.offsetHeight -
                  popupElement.clientHeight +
                  scrollArrowHeight;
              }
            }
          }
        }

        timeout.start(40, scrollNextItem);
      }

      timeout.start(40, scrollNextItem);
    },
    onMouseLeave() {
      timeout.clear();
    },
  };

  const shouldRender = () => visible() || keepMounted();

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      scrollArrowRef = el;
    },
    props: [defaultProps, elementProps],
  });

  return <Show when={shouldRender()}>{element()}</Show>;
}

export namespace SelectScrollArrow {
  export interface State {
    direction: 'up' | 'down';
    visible: boolean;
    side: Side | 'none';
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    direction: 'up' | 'down';
    /**
     * Whether to keep the HTML element in the DOM while the select menu is not scrollable.
     * @default false
     */
    keepMounted?: boolean;
  }
}
