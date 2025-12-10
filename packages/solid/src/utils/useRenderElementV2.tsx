import {
  children,
  createMemo,
  createSignal,
  Match,
  Show,
  splitProps,
  Switch,
  type Accessor,
  type JSX,
  type ValidComponent,
} from 'solid-js';
import { Dynamic, type DynamicProps } from 'solid-js/web';
import { mergeProps, mergePropsN } from '../merge-props';
import { access, type MaybeAccessor } from '../solid-helpers';
import { EMPTY_OBJECT } from './constants';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { resolveClassName } from './resolveClassName';
import type { BaseUIComponentProps, ComponentRenderFn, HTMLProps } from './types';

export type ComponentPropsToOmit<State extends Record<string, any>> =
  keyof RenderElement.ComponentProps<
    State,
    keyof JSX.IntrinsicElements,
    JSX.IntrinsicElements[keyof JSX.IntrinsicElements]
  >;

export function useRenderElement<
  State extends Record<string, MaybeAccessor<any>>,
  TagName extends keyof JSX.IntrinsicElements,
  RenderedElementType extends JSX.IntrinsicElements[TagName],
  RefType extends RenderedElementType['ref'],
  Enabled extends boolean | undefined = undefined,
>(
  element: TagName,
  componentProps: RenderElement.ComponentProps<State, TagName, RenderedElementType>,
  params: RenderElement.Parameters<State, TagName, RenderedElementType, RefType, Enabled>,
) {
  const state = createMemo(() => params.state?.() ?? (EMPTY_OBJECT as State));
  const enabled = createMemo(() => access(params.enabled) ?? true);
  const safeChildren = childrenLazy(componentProps, params);

  const styleHooks = createMemo<Record<string, string> | undefined>(() => {
    if (params.disableStyleHooks !== true) {
      return enabled()
        ? getStyleHookProps(state(), access(params.customStyleHookMapping))
        : EMPTY_OBJECT;
    }
    return undefined;
  });

  const outProps = createMemo<Record<string, unknown>>(() => {
    const mergedParams = Array.isArray(params.props)
      ? mergePropsN(params.props)
      : access(params.props);

    if (mergedParams === undefined) {
      return EMPTY_OBJECT;
    }

    const [, rest] = splitProps(mergedParams, ['children']);
    return mergeProps(styleHooks(), rest, {
      class: resolveClassName(componentProps.class, state),
    });
  });

  function handleRef(el: any) {
    if (typeof componentProps.ref === 'function') {
      componentProps.ref(el);
    } else {
      componentProps.ref = el;
    }

    if (
      componentProps.render &&
      typeof componentProps.render === 'object' &&
      'ref' in componentProps.render
    ) {
      if (typeof componentProps.render.ref === 'function') {
        componentProps.render.ref(el);
      } else {
        componentProps.render.ref = el;
      }
    }

    if (typeof params.ref === 'function') {
      params.ref(el);
    } else {
      params.ref = el;
    }
  }

  return (renderFnProps?: HTMLProps) => {
    return (
      <Show when={enabled()}>
        <Show
          when={typeof componentProps.render === 'function'}
          fallback={
            <Dynamic
              component={
                typeof componentProps.render === 'string' ? componentProps.render : element
              }
              {...(element === 'button' ? { type: 'button' } : {})}
              {...(element === 'img' ? { alt: '' } : {})}
              {...mergeProps(
                renderFnProps,
                typeof componentProps.render === 'object' ? (componentProps.render as object) : {},
                outProps(),
              )}
              ref={handleRef}
            >
              {safeChildren()}
            </Dynamic>
          }
        >
          {(_) => {
            const renderedResult = (componentProps.render as Function)(
              renderFnProps ? mergeProps(renderFnProps, outProps()) : outProps(),
              state(),
            );
            if (typeof renderedResult === 'function') {
              return renderedResult;
            }

            return (
              <Dynamic
                {...renderedResult}
                ref={(el: any) => {
                  handleRef(el);

                  if ('ref' in renderedResult) {
                    if (typeof renderedResult.ref === 'function') {
                      renderedResult.ref(el);
                    } else {
                      renderedResult.ref = el;
                    }
                  }
                }}
              />
            );
          }}
        </Show>
      </Show>
    );
  };
}

// https://github.com/solidjs/solid/issues/2478#issuecomment-2888503241
function childrenLazy(props: any, params?: any) {
  const _s = Symbol();
  let x: any = _s;
  return () => {
    if (x === _s) {
      x = children(() => props.children ?? params.children);
    }
    return x;
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
    state?: Accessor<State>;
    /**
     * Intrinsic props to be spread on the rendered element.
     */
    children?: JSX.Element;
    props?:
      | BaseUIComponentProps<TagName, State>
      | Array<
          | BaseUIComponentProps<TagName, State>
          | undefined
          | ((props: BaseUIComponentProps<TagName, State>) => BaseUIComponentProps<TagName, State>)
        >;

    /**
     * A mapping of state to style hooks.
     */
    customStyleHookMapping?: MaybeAccessor<CustomStyleHookMapping<State>>;
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
    class?: string | ((state: Accessor<State>) => string);
    /**
     * The render prop or Solid element to override the default element.
     */
    render?:
      | keyof JSX.IntrinsicElements
      | DynamicProps<RenderFnElement>
      | ComponentRenderFn<Record<string, unknown>, State, RenderFnElement>
      | ((props: Record<string, unknown>, state: State) => JSX.Element)
      | null;
    /**
     * The children to render.
     */
    children?: JSX.Element;
    /**
     * The ref to apply to the rendered element.
     */
    ref?: RenderedElementType['ref'];
  }
}
