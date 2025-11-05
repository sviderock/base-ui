import type { Accessor, ComponentProps, JSX, Ref } from 'solid-js';

export type HTMLProps<T = any> = JSX.HTMLAttributes<T>;

export type BaseUIEvent<E extends Event> = E & {
  preventBaseUIHandler: () => void;
  readonly baseUIHandlerPrevented?: boolean;
};

type WithPreventBaseUIHandler<
  T,
  K extends keyof JSX.HTMLAttributes<T>,
  ExtractedEvent = ExtractEvent<T, K> extends infer E extends Event
    ? BaseUIEvent<Omit<E, 'currentTarget' | 'target'> & Pick<Event, 'target' | 'currentTarget'>>
    : false,
> = ExtractedEvent extends false
  ? JSX.HTMLAttributes<T>[K]
  : K extends `${string}:${string}`
    ? JSX.EventHandlerWithOptionsUnion<T, Event & ExtractedEvent>
    : JSX.EventHandlerUnion<T, Event & ExtractedEvent>;

/**
 * Adds a `preventBaseUIHandler` method to all event handlers.
 */
export type WithBaseUIEvent<T> = {
  [K in keyof JSX.HTMLAttributes<T>]: WithPreventBaseUIHandler<T, K>;
};

// TODO: this seems to slow down the tsserver a lot (2-5s for each cmd+s to complete)
type ExtractEventHandler<T, K extends string> = K extends keyof JSX.CustomEventHandlersCamelCase<T>
  ? Extract<JSX.CustomEventHandlersCamelCase<T>[K], Function>
  : K extends keyof JSX.CustomEventHandlersLowerCase<T>
    ? Extract<JSX.CustomEventHandlersLowerCase<T>[K], Function>
    : K extends keyof JSX.CustomEventHandlersNamespaced<T>
      ? Extract<JSX.CustomEventHandlersNamespaced<T>[K], Function>
      : never;

type ExtractEvent<T, K extends keyof JSX.HTMLAttributes<T>> =
  Parameters<ExtractEventHandler<T, K>> extends [infer E] ? E : never;

/**
 * Shape of the render prop: a function that takes props to be spread on the element and component's state and returns a React element.
 *
 * @template Props Props to be spread on the rendered element.
 * @template State Component's internal state.
 */
export type ComponentRenderFn<Props, State> = (
  props: Accessor<Props>,
  state: Accessor<State>,
) => JSX.Element;

/**
 * Props shared by all Base UI components.
 * Contains `class` (string or callback taking the component's state as an argument) and `render` (function to customize rendering).
 */
export type BaseUIComponentProps<
  ElementType extends keyof JSX.IntrinsicElements,
  State,
  RenderFunctionProps = ComponentProps<ElementType>,
> = Omit<
  WithBaseUIEvent<ElementType>,
  'class' | 'color' | 'defaultValue' | 'defaultChecked' | 'ref'
> & {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  class?: string | ((state: State) => string);
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render?: ComponentRenderFn<RenderFunctionProps, State>;
  ref?: Ref<ComponentProps<ElementType>['ref']>;
};

/**
 * Simplifies the display of a type (without modifying it).
 * Taken from https://effectivetypescript.com/2022/02/25/gentips-4-display/
 */
export type Simplify<T> = T extends Function ? T : { [K in keyof T]: T[K] };

export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Pick<T, K>;

export type Orientation = 'horizontal' | 'vertical';
