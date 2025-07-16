'use client';
import { createEffect, createSignal, on, type Accessor, type JSX, type Setter } from 'solid-js';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';

export type AnimationType = 'css-transition' | 'css-animation' | 'none' | null;

export interface Dimensions {
  height: number | undefined;
  width: number | undefined;
}

export function useCollapsibleRoot(
  parameters: useCollapsibleRoot.Parameters,
): useCollapsibleRoot.ReturnValue {
  const isControlled = () => parameters.open?.() !== undefined;

  const [open, setOpen] = useControlled({
    controlled: () => parameters.open?.(),
    default: () => parameters.defaultOpen?.(),
    name: 'Collapsible',
    state: 'open',
  });

  const [state, setState] = useTransitionStatus(open, true, true);
  const [visible, setVisible] = createSignal(open());
  const [dimensions, setDimensions] = createSignal<Dimensions>({
    height: undefined,
    width: undefined,
  });

  const defaultPanelId = useBaseUiId();
  const [panelIdState, setPanelIdState] = createSignal<string | undefined>();
  const panelId = () => panelIdState() ?? defaultPanelId();

  const [hiddenUntilFound, setHiddenUntilFound] = createSignal(false);
  const [keepMounted, setKeepMounted] = createSignal(false);

  let abortControllerRef = null as AbortController | null;
  const animationTypeRef: AnimationType = null;
  const transitionDimensionRef: 'width' | 'height' | null = null;

  let panelRef = null as HTMLElement | null;

  const runOnceAnimationsFinish = useAnimationsFinished(panelRef, () => false);

  function handleTrigger() {
    const nextOpen = !open();

    if (animationTypeRef === 'css-animation' && panelRef != null) {
      panelRef.style.removeProperty('animation-name');
    }

    if (!hiddenUntilFound() && !keepMounted()) {
      if (animationTypeRef != null && animationTypeRef !== 'css-animation') {
        if (!state.mounted && nextOpen) {
          setState('mounted', true);
        }
      }

      if (animationTypeRef === 'css-animation') {
        if (!visible() && nextOpen) {
          setVisible(true);
        }
        if (!state.mounted && nextOpen) {
          setState('mounted', true);
        }
      }
    }

    setOpen(nextOpen);
    parameters.onOpenChange(nextOpen);

    if (animationTypeRef === 'none') {
      if (state.mounted && !nextOpen) {
        setState('mounted', false);
      }
    }
  }

  createEffect(
    on([open, keepMounted, () => parameters.open?.(), isControlled], () => {
      /**
       * Unmount immediately when closing in controlled mode and keepMounted={false}
       * and no CSS animations or transitions are applied
       */
      if (isControlled() && animationTypeRef === 'none' && !keepMounted() && !open()) {
        setState('mounted', false);
      }
    }),
  );

  return {
    abortControllerRef,
    animationTypeRef,
    disabled: parameters.disabled,
    handleTrigger,
    height: () => dimensions().height,
    mounted: () => state.mounted,
    open,
    panelId,
    panelRef,
    runOnceAnimationsFinish,
    setDimensions,
    setHiddenUntilFound,
    setKeepMounted,
    setMounted: (mounted) => setState('mounted', mounted),
    setOpen,
    setPanelIdState,
    setVisible,
    transitionDimensionRef,
    transitionStatus: () => state.transitionStatus,
    visible,
    width: () => dimensions().width,
  };
}

export namespace useCollapsibleRoot {
  export interface Parameters {
    /**
     * Whether the collapsible panel is currently open.
     *
     * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
     */
    open?: Accessor<boolean | undefined>;
    /**
     * Whether the collapsible panel is initially open.
     *
     * To render a controlled collapsible, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: Accessor<boolean | undefined>;
    /**
     * Event handler called when the panel is opened or closed.
     */
    onOpenChange: (open: boolean) => void;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled: Accessor<boolean>;
  }

  export interface ReturnValue {
    abortControllerRef: AbortController | null;
    animationTypeRef: AnimationType;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: Accessor<boolean>;
    handleTrigger: () => void;
    /**
     * The height of the panel.
     */
    height: Accessor<number | undefined>;
    /**
     * Whether the collapsible panel is currently mounted.
     */
    mounted: Accessor<boolean>;
    /**
     * Whether the collapsible panel is currently open.
     */
    open: Accessor<boolean>;
    panelId: Accessor<JSX.HTMLAttributes<Element>['id']>;
    panelRef: HTMLElement | null;
    runOnceAnimationsFinish: (fnToExecute: () => void, signal?: AbortSignal | null) => void;
    setDimensions: Setter<Dimensions>;
    setHiddenUntilFound: Setter<boolean>;
    setKeepMounted: Setter<boolean>;
    setMounted: (open: boolean) => void;
    setOpen: (open: boolean) => void;
    setPanelIdState: (id: string | undefined) => void;
    setVisible: Setter<boolean>;
    transitionDimensionRef: 'height' | 'width' | null;
    transitionStatus: Accessor<TransitionStatus>;
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
}
