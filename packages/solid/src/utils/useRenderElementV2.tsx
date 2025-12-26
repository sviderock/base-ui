import { mergeProps, Show, type JSX, type ValidComponent } from 'solid-js';
import { Dynamic, type DynamicProps } from 'solid-js/web';
import { combineProps } from '../merge-props/combineProps';
import { access, type MaybeAccessor } from '../solid-helpers';
import { EMPTY_OBJECT } from './constants';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { resolveClassName } from './resolveClassName';
import type { BaseUIComponentProps, ComponentRenderFn, HTMLProps } from './types';

export function useRenderElement<
  State extends Record<string, MaybeAccessor<any>>,
  TagName extends keyof JSX.IntrinsicElements,
  RenderedElementType extends JSX.IntrinsicElements[TagName],
  RefType extends RenderedElementType['ref'],
  Enabled extends boolean | undefined = undefined,
>(
  element: MaybeAccessor<TagName>,
  componentProps: RenderElement.ComponentProps<State, TagName, RenderedElementType>,
  params: RenderElement.Parameters<State, TagName, RenderedElementType, RefType, Enabled>,
) {
  const Component = (props: HTMLProps) => {
    return (
      <Show when={access(params.enabled) ?? true}>
        <Dynamic
          component={(p: any) => {
            if (typeof componentProps.render === 'function') {
              return componentProps.render(p, params.state ?? (EMPTY_OBJECT as State));
            }

            if (
              componentProps.render &&
              typeof componentProps.render === 'object' &&
              'component' in componentProps.render
            ) {
              return <Dynamic component={componentProps.render.component} {...p} />;
            }

            return (
              <Dynamic
                component={
                  typeof componentProps.render === 'string'
                    ? componentProps.render
                    : access(element)
                }
                {...(access(element) === 'button' ? { type: 'button' } : {})}
                {...(access(element) === 'img' ? { alt: '' } : {})}
                {...p}
              />
            );
          }}
          {...combineProps([
            props,

            {
              ref: (el: any) => {
                if (typeof componentProps.ref === 'function') {
                  componentProps.ref(el);
                } else {
                  componentProps.ref = el;
                }

                if (typeof params.ref === 'function') {
                  params.ref(el);
                } else {
                  params.ref = el;
                }
              },
            },

            typeof componentProps.render === 'object' ? (componentProps.render as object) : {},

            params.disableStyleHooks !== true
              ? getStyleHookProps(params.state ?? EMPTY_OBJECT, params.customStyleHookMapping)
              : undefined,

            combineProps(params.props),

            {
              get class() {
                return resolveClassName(componentProps.class, params.state);
              },
            },
          ])}
        >
          {componentProps.children}
        </Dynamic>
      </Show>
    );
  };

  return (renderFnProps: HTMLProps = EMPTY_OBJECT) => {
    return <Component {...renderFnProps} />;
  };
}

export namespace RenderElement {
  export type Parameters<
    State extends Record<string, MaybeAccessor<any>>,
    TagName extends keyof JSX.IntrinsicElements,
    RenderedElementType extends JSX.IntrinsicElements[TagName],
    RefType extends RenderedElementType['ref'],
    Enabled extends boolean | undefined,
  > = {
    /**
     * If `false`, the hook will skip most of its internal logic and return `null`.
     * This is useful for rendering a component conditionally.
     * @default true
     */
    enabled?: MaybeAccessor<Enabled>;
    /**
     * @deprecated
     */
    propGetter?: (externalProps: HTMLProps) => HTMLProps;
    /**
     * The ref to apply to the rendered element.
     */
    ref?: RefType | null | HTMLElement;
    /**
     * The state of the component.
     */
    state?: State;
    /**
     * Intrinsic props to be spread on the rendered element.
     */
    children?: JSX.Element | ((...args: any[]) => JSX.Element);
    props?:
      | MaybeAccessor<BaseUIComponentProps<TagName, State>>
      | Array<
          | BaseUIComponentProps<TagName, State>
          | undefined
          | ((
              props: BaseUIComponentProps<TagName, State>,
            ) => BaseUIComponentProps<TagName, State> | undefined | null)
        >;

    /**
     * A mapping of state to style hooks.
     */
    customStyleHookMapping?: CustomStyleHookMapping<State>;
  } /* This typing ensures `disableStyleHookMapping` is constantly defined or undefined */ & (
    | {
        /**
         * Disable style hook mapping.
         */
        disableStyleHooks: true;
      }
    | {
        /**
         * Disable style hook mapping.
         */
        disableStyleHooks?: false;
      }
  );

  export interface ComponentProps<
    State extends Record<string, MaybeAccessor<any>>,
    TagName extends keyof JSX.IntrinsicElements,
    RenderedElementType extends JSX.IntrinsicElements[TagName],
    RenderFnElement extends ValidComponent = ValidComponent,
  > {
    /**
     * The class name to apply to the rendered element.
     * Can be a string or a function that accepts the state and returns a string.
     */
    class?: string | ((state: State) => string);
    /**
     * The render prop or Solid element to override the default element.
     */
    render?:
      | keyof JSX.IntrinsicElements
      | DynamicProps<RenderFnElement>
      | ComponentRenderFn<Record<string, unknown>, State>
      | null;
    /**
     * The children to render.
     */
    children?: JSX.Element | ((...args: any[]) => JSX.Element);
    /**
     * The ref to apply to the rendered element.
     */
    ref?: RenderedElementType['ref'];
  }
}
