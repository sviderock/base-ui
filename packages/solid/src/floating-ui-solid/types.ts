import type {
  ComputePositionConfig,
  ComputePositionReturn,
  VirtualElement,
} from '@floating-ui/dom';
import type { Accessor, JSX, Setter } from 'solid-js';
import type { ExtendedUserProps } from './hooks/useInteractions';

export {
  arrow,
  autoPlacement,
  autoUpdate,
  computePosition,
  detectOverflow,
  flip,
  getOverflowAncestors,
  hide,
  inline,
  limitShift,
  offset,
  platform,
  shift,
  size,
} from '@floating-ui/dom';
export type {
  AlignedPlacement,
  Alignment,
  ArrowOptions,
  AutoPlacementOptions,
  AutoUpdateOptions,
  Axis,
  Boundary,
  ClientRectObject,
  ComputePositionConfig,
  ComputePositionReturn,
  Coords,
  DetectOverflowOptions,
  Dimensions,
  ElementContext,
  ElementRects,
  Elements,
  FlipOptions,
  FloatingElement,
  HideOptions,
  InlineOptions,
  Length,
  Middleware,
  MiddlewareArguments,
  MiddlewareData,
  MiddlewareReturn,
  MiddlewareState,
  NodeScroll,
  OffsetOptions,
  Padding,
  Placement,
  Platform,
  Rect,
  ReferenceElement,
  RootBoundary,
  ShiftOptions,
  Side,
  SideObject,
  SizeOptions,
  Strategy,
  VirtualElement,
} from '@floating-ui/dom';
export * from '.';
export type { FloatingDelayGroupProps } from './components/FloatingDelayGroup';
export type { FloatingFocusManagerProps } from './components/FloatingFocusManager';
export type { FloatingPortalProps, UseFloatingPortalNodeProps } from './components/FloatingPortal';
export type { FloatingNodeProps, FloatingTreeProps } from './components/FloatingTree';
export type { UseClientPointProps } from './hooks/useClientPoint';
export type { UseDismissProps } from './hooks/useDismiss';
export type { UseFloatingRootContextOptions } from './hooks/useFloatingRootContext';
export type { UseFocusProps } from './hooks/useFocus';
export type { HandleClose, HandleCloseContext, UseHoverProps } from './hooks/useHover';
export type { UseInteractionsReturn } from './hooks/useInteractions';
export type { UseListNavigationProps } from './hooks/useListNavigation';
export type { UseRoleProps } from './hooks/useRole';
export type { UseTypeaheadProps } from './hooks/useTypeahead';
export type { SafePolygonOptions } from './safePolygon';

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type OpenChangeReason =
  | 'outside-press'
  | 'escape-key'
  | 'ancestor-scroll'
  | 'reference-press'
  | 'click'
  | 'hover'
  | 'focus'
  | 'focus-out'
  | 'list-navigation'
  | 'safe-polygon';

export type Delay = number | Partial<{ open: number; close: number }>;

export type NarrowedElement<T> = T extends Element ? T : Element;

export interface ExtendedRefs<RT> {
  reference: Accessor<ReferenceType | null>;
  floating: Accessor<HTMLElement | null>;
  domReference: Accessor<NarrowedElement<RT> | null>;
  setReference: Setter<RT | null>;
  setFloating: Setter<HTMLElement | null>;
  setPositionReference: Setter<ReferenceType | null>;
}

export interface ExtendedElements<RT> {
  reference: Accessor<ReferenceType | null>;
  floating: Accessor<HTMLElement | null>;
  domReference: Accessor<NarrowedElement<RT> | null>;
}

export interface FloatingEvents {
  emit<T extends string>(event: T, data?: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
}

export interface ContextData {
  openEvent?: Event;
  floatingContext?: FloatingContext;
  /** @deprecated use `onTypingChange` prop in `useTypeahead` */
  typing?: boolean;
  [key: string]: any;
}

export interface FloatingRootContext<RT extends ReferenceType = ReferenceType> {
  dataRef: ContextData;
  open: boolean;
  onOpenChange: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  elements: {
    domReference: Element | null;
    reference: RT | null;
    floating: HTMLElement | null;
  };
  events: FloatingEvents;
  floatingId: string | undefined;
  refs: {
    setPositionReference(node: ReferenceType | null): void;
  };
}

export type FloatingContext<RT extends ReferenceType = ReferenceType> = Omit<
  RT,
  'refs' | 'elements'
> & {
  open: boolean;
  onOpenChange(open: boolean, event?: Event, reason?: OpenChangeReason): void;
  events: FloatingEvents;
  dataRef: ContextData;
  nodeId: string | undefined;
  floatingId: string | undefined;
  refs: ExtendedRefs<RT>;
  elements: ExtendedElements<RT>;
};

export interface FloatingNodeType<RT extends ReferenceType = ReferenceType> {
  id: Accessor<string | undefined>;
  parentId: Accessor<string | null>;
  context?: FloatingContext<RT>;
}

export interface FloatingTreeType<RT extends ReferenceType = ReferenceType> {
  nodesRef: React.MutableRefObject<Array<FloatingNodeType<RT>>>;
  events: FloatingEvents;
  addNode(node: FloatingNodeType): void;
  removeNode(node: FloatingNodeType): void;
}

export interface ElementProps {
  reference?: React.HTMLProps<Element>;
  floating?: React.HTMLProps<HTMLElement>;
  item?:
    | React.HTMLProps<HTMLElement>
    | ((props: ExtendedUserProps) => React.HTMLProps<HTMLElement>);
}

export type ReferenceType = Element | VirtualElement;

export type UseFloatingData = Prettify<UseFloatingReturn>;

export type UseFloatingReturn<RT extends ReferenceType = ReferenceType> = Prettify<
  ComputePositionReturn & { isPositioned: boolean } & {
    /**
     * Update the position of the floating element, re-rendering the component
     * if required.
     */
    update: () => void;
    /**
     * Pre-configured positioning styles to apply to the floating element.
     */
    floatingStyles: Accessor<JSX.CSSProperties>;
    /**
     * `FloatingContext`
     */
    context: Prettify<FloatingContext<RT>>;
    /**
     * Object containing the reference and floating refs and reactive setters.
     */
    refs: ExtendedRefs<RT>;
    elements: ExtendedElements<RT>;
  }
>;

export interface UseFloatingOptions<RT extends ReferenceType = ReferenceType>
  extends Prettify<Partial<ComputePositionConfig>> {
  /**
   * A callback invoked when both the reference and floating elements are
   * mounted, and cleaned up when either is unmounted. This is useful for
   * setting up event listeners (e.g. pass `autoUpdate`).
   */
  whileElementsMounted?: (reference: RT, floating: HTMLElement, update: () => void) => () => void;

  rootContext?: FloatingRootContext<RT>;
  /**
   * Object of external elements as an alternative to the `refs` object setters.
   */
  elements?: {
    /**
     * Externally passed reference element. Store in state.
     */
    reference?: Element | null;
    /**
     * Externally passed floating element. Store in state.
     */
    floating?: HTMLElement | null;
  };
  /**
   * An event callback that is invoked when the floating element is opened or
   * closed.
   */
  onOpenChange?(open: boolean, event?: Event, reason?: OpenChangeReason): void;
  /**
   * Unique node id when using `FloatingTree`.
   */
  nodeId?: string;
  /**
   * The `open` state of the floating element to synchronize with the
   * `isPositioned` value.
   * @default false
   */
  open?: boolean;
  /**
   * Whether to use `transform` for positioning instead of `top` and `left`
   * (layout) in the `floatingStyles` object.
   * @default true
   */
  transform?: boolean;
}
