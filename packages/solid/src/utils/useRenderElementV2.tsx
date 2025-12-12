import {
  createMemo,
  Show,
  splitProps,
  type Accessor,
  type JSX,
  type ValidComponent,
} from 'solid-js';
import { Dynamic, type DynamicProps } from 'solid-js/web';
import { mergeProps, mergePropsN } from '../merge-props';
import { access, childrenLazy, type MaybeAccessor } from '../solid-helpers';
import { EMPTY_OBJECT } from './constants';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { resolveClassName } from './resolveClassName';
import type { BaseUIComponentProps, HTMLProps } from './types';

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
  elementProp: MaybeAccessor<TagName>,
  componentProps: RenderElement.ComponentProps<State, TagName, RenderedElementType>,
  params: RenderElement.Parameters<State, TagName, RenderedElementType, RefType, Enabled>,
) {
  const element = () => access(elementProp);
  const state = createMemo(() => params.state?.() ?? (EMPTY_OBJECT as State));
  const enabled = createMemo(() => access(params.enabled) ?? true);
  const props = createMemo(() => access(params.props));
  const safeChildren = childrenLazy(() => params.children ?? componentProps.children);

  const styleHooks = createMemo<Record<string, string> | undefined>(() => {
    if (params.disableStyleHooks !== true) {
      return enabled()
        ? getStyleHookProps(state(), access(params.customStyleHookMapping))
        : EMPTY_OBJECT;
    }
    return undefined;
  });

  const outProps = createMemo(() => {
    const p = props();
    const mergedParams = Array.isArray(p) ? mergePropsN(p) : p;
    if (mergedParams === undefined) {
      return EMPTY_OBJECT;
    }

    const [, rest] = splitProps(mergedParams, ['children']);
    return mergeProps(styleHooks(), rest, {
      class: resolveClassName(componentProps.class, state),
    });
  });

  const renderer = (p: any) => (componentProps.render as Function)(p, state());
  const Component = createMemo<DynamicProps<ValidComponent>['component']>(() => {
    if (typeof componentProps.render === 'function') {
      return renderer;
    }

    if (typeof componentProps.render === 'string') {
      return componentProps.render;
    }

    return element();
  });

  return (renderFnProps?: HTMLProps) => {
    return (
      <Show when={enabled()}>
        <Dynamic
          component={Component()}
          {...(element() === 'button' ? { type: 'button' } : {})}
          {...(element() === 'img' ? { alt: '' } : {})}
          {...mergeProps(
            renderFnProps,
            typeof componentProps.render === 'object'
              ? (componentProps.render as object)
              : undefined,
            outProps(),
          )}
          ref={(el: any) => {
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

            if (renderFnProps) {
              if (typeof renderFnProps.ref === 'function') {
                renderFnProps.ref(el);
              } else {
                renderFnProps.ref = el;
              }
            }
          }}
        >
          {safeChildren()}
        </Dynamic>
      </Show>
    );
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
      // | ComponentRenderFn<Record<string, unknown>, State, RenderFnElement>
      | ((props: Record<string, unknown>, state: State) => JSX.Element)
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
