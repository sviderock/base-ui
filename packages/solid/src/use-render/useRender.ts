import type { JSX, Ref, ComponentProps as SolidComponentProps, ValidComponent } from 'solid-js';
import type { DynamicProps } from 'solid-js/web';
import type { MaybeAccessor } from '../solid-helpers';
import type { ComponentRenderFn, HTMLProps } from '../utils/types';
import { useRenderElement } from '../utils/useRenderElement';

/**
 * Renders a Base UI element.
 *
 * @public
 */
export function useRender<
  State extends Record<string, MaybeAccessor<any>>,
  RenderedElementType extends Element,
  Enabled extends boolean | undefined,
>(
  params: useRender.Parameters<State, RenderedElementType, Enabled>,
): useRender.ReturnValue<Enabled> {
  const renderParams = params as useRender.Parameters<State, RenderedElementType, Enabled> & {
    disableStyleHooks: boolean;
  };
  renderParams.disableStyleHooks = true;

  return useRenderElement(undefined, renderParams, renderParams);
}

export namespace useRender {
  export type RenderProp<
    State extends Record<string, MaybeAccessor<any>> = Record<string, unknown>,
    ElementType extends ValidComponent = ValidComponent,
  > =
    | keyof JSX.IntrinsicElements
    | DynamicProps<ElementType>
    | ComponentRenderFn<Record<string, unknown>, State>
    | null;

  export type ElementProps<ElementType extends Element> = JSX.HTMLAttributes<ElementType>;

  export type ComponentProps<
    ElementType extends ValidComponent,
    State extends Record<string, MaybeAccessor<any>> = {},
  > = JSX.HTMLAttributes<ElementType> & {
    /**
     * Allows you to replace the component’s HTML element
     * with a different tag, or compose it with another component.
     *
     * Accepts a `ReactElement` or a function that returns the element to render.
     */
    render?: RenderProp<State, ElementType>;
  };

  export interface Parameters<
    State extends Record<string, MaybeAccessor<any>>,
    RenderedElementType extends Element,
    Enabled extends boolean | undefined,
  > {
    /**
     * The React element or a function that returns one to override the default element.
     */
    render: RenderProp<State>;
    /**
     * The ref to apply to the rendered element.
     */
    ref?: Ref<RenderedElementType>;
    /**
     * The state of the component, passed as the second argument to the `render` callback.
     */
    state?: State;
    /**
     * Props to be spread on the rendered element.
     * They are merged with the internal props of the component, so that event handlers
     * are merged, `className` strings and `style` properties are joined, while other external props overwrite the
     * internal ones.
     */
    props?: Record<string, unknown>;
    /**
     * If `false`, the hook will skip most of its internal logic and return `null`.
     * This is useful for rendering a component conditionally.
     * @default true
     */
    enabled?: MaybeAccessor<Enabled>;
    /**
     * The children to render.
     */
    children?: JSX.Element | ((...args: any[]) => JSX.Element);
  }

  export type ReturnValue<Enabled extends boolean | undefined> = (
    props?: HTMLProps,
  ) => Enabled extends false ? null : JSX.Element;
}
