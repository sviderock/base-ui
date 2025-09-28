'use client';
import { createEffect, createSignal, on, type Accessor, type JSX, type Setter } from 'solid-js';
import { access, type MaybeAccessor } from '../../solid-helpers';
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
  const openParam = () => access(parameters.open);
  const defaultOpen = () => access(parameters.defaultOpen);
  const disabled = () => access(parameters.disabled);
  const isControlled = () => openParam() !== undefined;

  const [open, setOpen] = useControlled({
    controlled: openParam,
    default: defaultOpen,
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
  const refs: useCollapsibleRoot.ReturnValue['refs'] = {
    panelRef: null,
  };

  const [animationType, setAnimationType] = createSignal<AnimationType>(null);
  const [transitionDimension, setTransitionDimension] = createSignal<'width' | 'height' | null>(
    null,
  );

  const runOnceAnimationsFinish = useAnimationsFinished(refs.panelRef, () => false);

  function handleTrigger() {
    const nextOpen = !open();

    if (animationType() === 'css-animation' && refs.panelRef != null) {
      refs.panelRef!.style.removeProperty('animation-name');
    }

    if (!hiddenUntilFound() && !keepMounted()) {
      if (animationType() != null && animationType() !== 'css-animation') {
        if (!state.mounted && nextOpen) {
          setState('mounted', true);
        }
      }

      if (animationType() === 'css-animation') {
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

    if (animationType() === 'none') {
      if (state.mounted && !nextOpen) {
        setState('mounted', false);
      }
    }
  }

  createEffect(
    on([open, keepMounted, openParam, isControlled, animationType], () => {
      /**
       * Unmount immediately when closing in controlled mode and keepMounted={false}
       * and no CSS animations or transitions are applied
       */
      if (isControlled() && animationType() === 'none' && !keepMounted() && !open()) {
        setState('mounted', false);
      }
    }),
  );

  return {
    abortControllerRef,
    animationType,
    setAnimationType,
    disabled,
    handleTrigger,
    height: () => dimensions().height,
    mounted: () => state.mounted,
    open,
    panelId,
    refs,
    runOnceAnimationsFinish,
    setDimensions,
    setHiddenUntilFound,
    setKeepMounted,
    setMounted: (mounted) => setState('mounted', mounted),
    setOpen,
    setPanelIdState,
    setVisible,
    transitionDimension,
    setTransitionDimension,
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
    open?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the collapsible panel is initially open.
     *
     * To render a controlled collapsible, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: MaybeAccessor<boolean | undefined>;
    /**
     * Event handler called when the panel is opened or closed.
     */
    onOpenChange: (open: boolean) => void;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled: MaybeAccessor<boolean>;
  }

  export interface ReturnValue {
    abortControllerRef: AbortController | null;
    animationType: Accessor<AnimationType>;
    setAnimationType: Setter<AnimationType>;
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
    refs: {
      panelRef: HTMLElement | null | undefined;
    };
    runOnceAnimationsFinish: (fnToExecute: () => void, signal?: AbortSignal | null) => void;
    setDimensions: Setter<Dimensions>;
    setHiddenUntilFound: Setter<boolean>;
    setKeepMounted: Setter<boolean>;
    setMounted: (open: boolean) => void;
    setOpen: (open: boolean) => void;
    setPanelIdState: (id: string | undefined) => void;
    setVisible: Setter<boolean>;
    transitionDimension: Accessor<'height' | 'width' | null>;
    setTransitionDimension: Setter<'height' | 'width' | null>;
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
