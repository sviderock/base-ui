import type { VirtualElement } from '@floating-ui/dom';
import type { Accessor, JSX } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import type { UsePositionFloatingReturn, UsePositionOptions } from './hooks/useFloatingOriginal';
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
  setReference: (value: RT | null) => void;
  setFloating: (value: HTMLElement | null) => void;
  setPositionReference: (value: ReferenceType | null) => void;
  setDomReference: (value: Element | null) => void;
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
  open: Accessor<boolean>;
  onOpenChange: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  elements: {
    domReference: Accessor<Element | null>;
    reference: Accessor<RT | null>;
    floating: Accessor<HTMLElement | null>;
  };
  events: FloatingEvents;
  floatingId: Accessor<string | undefined>;
  refs: {
    setPositionReference(node: ReferenceType | null): void;
    setFloating(node: HTMLElement | null): void;
    setDomReference(node: Element | null): void;
  };
}

export type FloatingContext<RT extends ReferenceType = ReferenceType> = Omit<
  UsePositionFloatingReturn<RT>,
  'refs' | 'elements'
> & {
  open: Accessor<boolean>;
  onOpenChange(open: boolean, event?: Event, reason?: OpenChangeReason): void;
  events: FloatingEvents;
  dataRef: ContextData;
  nodeId: Accessor<string | undefined>;
  floatingId: Accessor<string | undefined>;
  refs: ExtendedRefs<RT>;
  elements: ExtendedElements<RT>;
};

export interface FloatingNodeType<RT extends ReferenceType = ReferenceType> {
  id: string | undefined;
  parentId: string | null;
  context?: FloatingContext<RT>;
}

export interface FloatingTreeType<RT extends ReferenceType = ReferenceType> {
  nodesRef: Store<Array<FloatingNodeType<RT>>>;
  setNodesRef: SetStoreFunction<Array<FloatingNodeType<RT>>>;
  events: FloatingEvents;
  addNode(node: FloatingNodeType): void;
  removeNode(node: FloatingNodeType): void;
}

export interface ElementProps {
  reference?: JSX.HTMLAttributes<Element>;
  floating?: JSX.HTMLAttributes<HTMLElement>;
  item?:
    | JSX.HTMLAttributes<HTMLElement>
    | ((props: ExtendedUserProps) => JSX.HTMLAttributes<HTMLElement>);
}

export type ReferenceType = Element | VirtualElement;

export type UseFloatingData = Prettify<UseFloatingReturn>;

export type UseFloatingReturn<RT extends ReferenceType = ReferenceType> = Prettify<
  Accessorify<Omit<UsePositionFloatingReturn, 'refs' | 'elements'>> & {
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

// TODO: explain the reasoning for this
export interface UseFloatingOptions<RT extends ReferenceType = ReferenceType>
  extends Omit<UsePositionOptions<RT>, 'elements'> {
  rootContext?: FloatingRootContext<RT>;
  /**
   * Object of external elements as an alternative to the `refs` object setters.
   */
  elements?: {
    /**
     * Externally passed reference element. Store in state.
     */
    reference?: Accessor<Element | null>;
    /**
     * Externally passed floating element. Store in state.
     */
    floating?: Accessor<HTMLElement | null>;
  };
  /**
   * An event callback that is invoked when the floating element is opened or
   * closed.
   */
  onOpenChange?(open: boolean, event?: Event, reason?: OpenChangeReason): void;
  /**
   * Unique node id when using `FloatingTree`.
   */
  nodeId?: Accessor<string | undefined>;
  /**
   * When `true` reference/floating events will use default Solid event
   * delegation using `on` events that are attached to document instead
   * of dom elements. This will prevent events inside Portal/iframe from
   * being captured by the parent elements.
   * Setting this to `false` will bind events using `on:` event listeners
   * which are attached to dom elements.
   * @default true
   */
  delegateEvents?: boolean;
}

export type Accessorify<T> = {
  [K in keyof T]: T[K] extends Accessor<any> ? T[K] : T[K] extends Function ? T[K] : Accessor<T[K]>;
};
