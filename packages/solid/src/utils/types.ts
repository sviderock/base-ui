import type { Accessor, ComponentProps, JSX, ValidComponent } from 'solid-js';
import type { DynamicProps } from 'solid-js/web';

export type HTMLProps<T = any> = JSX.HTMLAttributes<T>;

export type BaseUIEvent<E extends Event> = E & {
  preventBaseUIHandler: () => void;
  readonly baseUIHandlerPrevented?: boolean;
};

type WithPreventBaseUIHandler<T, K extends keyof T> =
  T[K] extends JSX.EventHandlerUnion<infer TT, infer E>
    ? JSX.EventHandlerUnion<TT, BaseUIEvent<E>>
    : T[K] extends JSX.EventHandlerWithOptionsUnion<infer TT, infer E>
      ? JSX.EventHandlerWithOptionsUnion<TT, BaseUIEvent<E>>
      : T[K] extends JSX.EventHandler<infer TT, infer E>
        ? JSX.EventHandler<TT, BaseUIEvent<E>>
        : T[K];

/**
 * Adds a `preventBaseUIHandler` method to all event handlers.
 */
export type WithBaseUIEvent<T> = {
  [K in keyof T]: WithPreventBaseUIHandler<T, K>;
};

/**
 * Shape of the render prop: a function that takes props to be spread on the element and component's state and returns a React element.
 *
 * @template Props Props to be spread on the rendered element.
 * @template State Component's internal state.
 */
export type ComponentRenderFn<Props, State> = (props: Props, state: Accessor<State>) => JSX.Element;

/**
 * Props shared by all Base UI components.
 * Contains `class` (string or callback taking the component's state as an argument) and `render` (function to customize rendering).
 *
 * TODO: Removing usage of Omit sped up tsserver, presumably because it doesn't need to iterate each property of the DOM element
 */
export type BaseUIComponentProps<
  ElementType extends keyof JSX.IntrinsicElements,
  State,
  RenderFnElement extends ValidComponent = ValidComponent,
> = WithBaseUIEvent<ComponentProps<ElementType>> & {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  class?: string | ((state: Accessor<State>) => string);
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render?:
    | keyof JSX.IntrinsicElements
    | DynamicProps<RenderFnElement>
    | ComponentRenderFn<JSX.HTMLAttributes<any>, State>
    | null;
};

/**
 * Simplifies the display of a type (without modifying it).
 * Taken from https://effectivetypescript.com/2022/02/25/gentips-4-display/
 */
export type Simplify<T> = T extends Function ? T : { [K in keyof T]: T[K] };

export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Pick<T, K>;

export type Orientation = 'horizontal' | 'vertical';
