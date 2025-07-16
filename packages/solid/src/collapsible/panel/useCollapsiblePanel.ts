'use client';
import {
  createEffect,
  createMemo,
  onCleanup,
  onMount,
  type Accessor,
  type JSX,
  type Ref,
} from 'solid-js';
import { AccordionRootDataAttributes } from '../../accordion/root/AccordionRootDataAttributes';
import { HTMLProps } from '../../utils/types';
import { AnimationFrame } from '../../utils/useAnimationFrame';
import { useForkRef } from '../../utils/useForkRef';
import { warn } from '../../utils/warn';
import type { AnimationType, Dimensions } from '../root/useCollapsibleRoot';
import { CollapsiblePanelDataAttributes } from './CollapsiblePanelDataAttributes';

export function useCollapsiblePanel<T extends HTMLElement>(
  parameters: useCollapsiblePanel.Parameters,
): useCollapsiblePanel.ReturnValue<T> {
  let isBeforeMatchRef = false;
  let latestAnimationNameRef = null as string | null;
  let shouldCancelInitialOpenAnimationRef = parameters.open();
  let shouldCancelInitialOpenTransitionRef = parameters.open();

  /**
   * When opening, the `hidden` attribute is removed immediately.
   * When closing, the `hidden` attribute is set after any exit animations runs.
   */
  const hidden = createMemo(() => {
    if (parameters.animationTypeRef === 'css-animation') {
      return !parameters.visible();
    }

    return !parameters.open() && !parameters.mounted();
  });

  /**
   * When `keepMounted` is `true` this runs once as soon as it exists in the DOM
   * regardless of initial open state.
   *
   * When `keepMounted` is `false` this runs on every mount, typically every
   * time it opens. If the panel is in the middle of a close transition that is
   * interrupted and re-opens, this won't run as the panel was not unmounted.
   */
  function handlePanelRef<T extends HTMLElement | null | undefined>(element: T) {
    console.log('handlePanelRef', { element });
    if (!element) {
      return undefined;
    }
    if (parameters.animationTypeRef == null || parameters.transitionDimensionRef == null) {
      const panelStyles = getComputedStyle(element);

      const hasAnimation = panelStyles.animationName !== 'none' && panelStyles.animationName !== '';
      const hasTransition =
        panelStyles.transitionDuration !== '0s' && panelStyles.transitionDuration !== '';

      /**
       * animationTypeRef is safe to read in render because it's only ever set
       * once here during the first render and never again.
       * https://react.dev/learn/referencing-values-with-refs#best-practices-for-refs
       */
      if (hasAnimation && hasTransition) {
        if (process.env.NODE_ENV !== 'production') {
          warn(
            'CSS transitions and CSS animations both detected on Collapsible or Accordion panel.',
            'Only one of either animation type should be used.',
          );
        }
      } else if (panelStyles.animationName === 'none' && panelStyles.transitionDuration !== '0s') {
        parameters.animationTypeRef = 'css-transition';
      } else if (panelStyles.animationName !== 'none' && panelStyles.transitionDuration === '0s') {
        parameters.animationTypeRef = 'css-animation';
      } else {
        parameters.animationTypeRef = 'none';
      }

      /**
       * We need to know in advance which side is being collapsed when using CSS
       * transitions in order to set the value of width/height to `0px` momentarily.
       * Setting both to `0px` will break layout.
       */
      if (
        element.getAttribute(AccordionRootDataAttributes.orientation) === 'horizontal' ||
        panelStyles.transitionProperty.indexOf('width') > -1
      ) {
        parameters.transitionDimensionRef = 'width';
      } else {
        parameters.transitionDimensionRef = 'height';
      }
    }

    if (parameters.animationTypeRef !== 'css-transition') {
      return undefined;
    }

    /**
     * Explicitly set `display` to ensure the panel is actually rendered before
     * measuring anything. `!important` is to needed to override a conflicting
     * Tailwind v4 default that sets `display: none !important` on `[hidden]`:
     * https://github.com/tailwindlabs/tailwindcss/blob/cd154a4f471e7a63cc27cad15dada650de89d52b/packages/tailwindcss/preflight.css#L320-L326
     */
    element.style.setProperty('display', 'block', 'important');

    if (parameters.height() === undefined || parameters.width() === undefined) {
      parameters.setDimensions({ height: element.scrollHeight, width: element.scrollWidth });
      element.style.removeProperty('display');

      if (shouldCancelInitialOpenTransitionRef) {
        element.style.setProperty('transition-duration', '0s');
      }
    }

    let frame = -1;
    let nextFrame = -1;

    frame = AnimationFrame.request(() => {
      shouldCancelInitialOpenTransitionRef = false;
      nextFrame = AnimationFrame.request(() => {
        /**
         * This is slightly faster than another RAF and is the earliest
         * opportunity to remove the temporary `transition-duration: 0s` that
         * was applied to cancel opening transitions of initially open panels.
         * https://nolanlawson.com/2018/09/25/accurately-measuring-layout-on-the-web/
         */
        setTimeout(() => {
          element.style.removeProperty('transition-duration');
        });
      });
    });

    return () => {
      AnimationFrame.cancel(frame);
      AnimationFrame.cancel(nextFrame);
    };
  }

  createEffect(() => {
    if (parameters.animationTypeRef !== 'css-transition') {
      return undefined;
    }

    const panel = parameters.panelRef;

    if (!panel) {
      return undefined;
    }

    let resizeFrame = -1;

    if (parameters.abortControllerRef != null) {
      parameters.abortControllerRef.abort();
      parameters.abortControllerRef = null;
    }

    if (parameters.open()) {
      /* opening */
      panel.style.setProperty('display', 'block', 'important');

      /**
       * When `keepMounted={false}` and the panel is initially closed, the very
       * first time it opens (not any subsequent opens) `data-starting-style` is
       * off or missing by a frame so we need to set it manually. Otherwise any
       * CSS properties expected to transition using [data-starting-style] may
       * be mis-timed and appear to be complete skipped.
       */
      if (!shouldCancelInitialOpenTransitionRef && !parameters.keepMounted()) {
        panel.setAttribute(CollapsiblePanelDataAttributes.startingStyle, '');
      }

      parameters.setDimensions({ height: panel.scrollHeight, width: panel.scrollWidth });

      resizeFrame = AnimationFrame.request(() => {
        panel.style.removeProperty('display');
      });
    } else {
      /* closing */
      parameters.setDimensions({ height: panel.scrollHeight, width: panel.scrollWidth });

      parameters.abortControllerRef = new AbortController();
      const signal = parameters.abortControllerRef.signal;

      let frame2 = -1;
      const frame1 = AnimationFrame.request(() => {
        // Wait until the `[data-ending-style]` attribute is added.
        frame2 = AnimationFrame.request(() => {
          parameters.runOnceAnimationsFinish(() => {
            parameters.setDimensions({ height: 0, width: 0 });
            panel.style.removeProperty('content-visibility');
            panel.style.removeProperty('display');
            parameters.setMounted(false);
            parameters.abortControllerRef = null;
          }, signal);
        });
      });

      onCleanup(() => {
        AnimationFrame.cancel(frame1);
        AnimationFrame.cancel(frame2);
      });
      return undefined;
    }

    onCleanup(() => {
      AnimationFrame.cancel(resizeFrame);
    });
  });

  createEffect(() => {
    if (parameters.animationTypeRef !== 'css-animation') {
      return;
    }

    const panel = parameters.panelRef;
    if (!panel) {
      return;
    }

    latestAnimationNameRef = panel.style.animationName || latestAnimationNameRef;

    panel.style.setProperty('animation-name', 'none');

    parameters.setDimensions({ height: panel.scrollHeight, width: panel.scrollWidth });

    if (!shouldCancelInitialOpenAnimationRef && !isBeforeMatchRef) {
      panel.style.removeProperty('animation-name');
    }

    if (parameters.open()) {
      if (parameters.abortControllerRef != null) {
        parameters.abortControllerRef.abort();
        parameters.abortControllerRef = null;
      }
      parameters.setMounted(true);
      parameters.setVisible(true);
    } else {
      parameters.abortControllerRef = new AbortController();
      parameters.runOnceAnimationsFinish(() => {
        parameters.setMounted(false);
        parameters.setVisible(false);
        parameters.abortControllerRef = null;
      }, parameters.abortControllerRef.signal);
    }
  });

  onMount(() => {
    const frame = AnimationFrame.request(() => {
      shouldCancelInitialOpenAnimationRef = false;
    });
    onCleanup(() => AnimationFrame.cancel(frame));
  });

  createEffect(() => {
    if (!parameters.hiddenUntilFound()) {
      return undefined;
    }

    const panel = parameters.panelRef;
    if (!panel) {
      return undefined;
    }

    let frame = -1;
    let nextFrame = -1;

    if (parameters.open() && isBeforeMatchRef) {
      panel.style.transitionDuration = '0s';
      parameters.setDimensions({ height: panel.scrollHeight, width: panel.scrollWidth });
      frame = AnimationFrame.request(() => {
        isBeforeMatchRef = false;
        nextFrame = AnimationFrame.request(() => {
          setTimeout(() => {
            panel.style.removeProperty('transition-duration');
          });
        });
      });
    }

    onCleanup(() => {
      AnimationFrame.cancel(frame);
      AnimationFrame.cancel(nextFrame);
    });
  });

  createEffect(() => {
    const panel = parameters.panelRef;

    if (panel && parameters.hiddenUntilFound() && hidden()) {
      /**
       * React only supports a boolean for the `hidden` attribute and forces
       * legit string values to booleans so we have to force it back in the DOM
       * when necessary: https://github.com/facebook/react/issues/24740
       */
      panel.setAttribute('hidden', 'until-found');
      /**
       * Set data-starting-style here to persist the closed styles, this is to
       * prevent transitions from starting when the `hidden` attribute changes
       * to `'until-found'` as they could have different `display` properties:
       * https://github.com/tailwindlabs/tailwindcss/pull/14625
       */
      if (parameters.animationTypeRef === 'css-transition') {
        panel.setAttribute(CollapsiblePanelDataAttributes.startingStyle, '');
      }
    }
  });

  createEffect(function registerBeforeMatchListener() {
    const panel = parameters.panelRef;
    if (!panel) {
      return undefined;
    }

    function handleBeforeMatch() {
      isBeforeMatchRef = true;
      parameters.setOpen(true);
      parameters.onOpenChange(true);
    }

    panel.addEventListener('beforematch', handleBeforeMatch);

    onCleanup(() => {
      panel.removeEventListener('beforematch', handleBeforeMatch);
    });
  });

  return {
    ref: useForkRef(
      parameters.externalRef as Ref<HTMLElement | null | undefined>,
      parameters.panelRef,
      (el) => {
        console.log('handlePanelRef', { el });
        handlePanelRef(el);
      },
    ),
    props: () => ({
      hidden: hidden(),
      id: parameters.id(),
    }),
  };
}

export namespace useCollapsiblePanel {
  export interface Parameters {
    abortControllerRef: AbortController | null;
    animationTypeRef: AnimationType;
    externalRef: Ref<HTMLDivElement | null | undefined>;
    /**
     * The height of the panel.
     */
    height: Accessor<number | undefined>;
    /**
     * Allows the browser’s built-in page search to find and expand the panel contents.
     *
     * Overrides the `keepMounted` prop and uses `hidden="until-found"`
     * to hide the element without removing it from the DOM.
     */
    hiddenUntilFound: Accessor<boolean>;
    /**
     * The `id` attribute of the panel.
     */
    id: Accessor<JSX.HTMLAttributes<Element>['id']>;
    /**
     * Whether to keep the element in the DOM while the panel is closed.
     * This prop is ignored when `hiddenUntilFound` is used.
     */
    keepMounted: Accessor<boolean>;
    /**
     * Whether the collapsible panel is currently mounted.
     */
    mounted: Accessor<boolean>;
    onOpenChange: (open: boolean) => void;
    /**
     * Whether the collapsible panel is currently open.
     */
    open: Accessor<boolean>;
    panelRef: HTMLElement | null;
    runOnceAnimationsFinish: (fnToExecute: () => void, signal?: AbortSignal | null) => void;
    setDimensions: (nextDimensions: Dimensions) => void;
    setMounted: (nextMounted: boolean) => void;
    setOpen: (nextOpen: boolean) => void;
    setVisible: (nextVisible: boolean) => void;
    transitionDimensionRef: 'height' | 'width' | null;
    /**
     * The visible state of the panel used to determine the `[hidden]` attribute
     * only when CSS keyframe animations are used.
     */
    visible: Accessor<boolean>;
    /**
     * The width of the panel.
     */
    width: Accessor<number | undefined>;
  }

  export interface ReturnValue<T extends HTMLElement> {
    ref: Ref<T | null | undefined>;
    props: Accessor<HTMLProps>;
  }
}
