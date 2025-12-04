import {
  children,
  createMemo,
  Match,
  splitProps,
  Switch,
  type Accessor,
  type ComponentProps,
  type JSX,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
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

  const mergedProps = (
    renderFnProps?: Accessor<JSX.HTMLAttributes<any>>,
  ): Record<string, unknown> => {
    if (enabled() === false) {
      return EMPTY_OBJECT;
    }

    let mergedParams = Array.isArray(params.props)
      ? mergePropsN(params.props)
      : access(params.props);
    if (renderFnProps) {
      mergedParams = mergeProps(renderFnProps(), mergedParams);
    }

    if (mergedParams === undefined) {
      return EMPTY_OBJECT;
    }

    const [, rest] = splitProps(mergedParams, ['children']);
    return mergeProps(styleHooks(), rest, {
      class: resolveClassName(componentProps.class, state),
    });
  };

  const outProps = (renderFnProps?: Accessor<ComponentProps<any>>): Record<string, unknown> => {
    if (enabled() === false) {
      return EMPTY_OBJECT;
    }

    const props = mergedProps(renderFnProps);
    // TODO: fix typing
    props.ref = (el: any) => {
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

      if (renderFnProps) {
        if (typeof renderFnProps().ref === 'function') {
          renderFnProps().ref(el);
        } else {
          renderFnProps().ref = el;
        }
      }
    };

    if (componentProps.render != null) {
      props.children = safeChildren;
    } else if (element === 'button') {
      (props as JSX.IntrinsicElements['button']).type = 'button';
    } else if (element === 'img') {
      (props as JSX.IntrinsicElements['img']).alt = '';
    }

    return props;
  };

  return <P extends Record<string, unknown>, S>(
    renderFnProps?: Accessor<P>,
    renderFnState?: Accessor<S>,
  ) => {
    return (
      <Switch>
        <Match when={enabled() && componentProps.render}>
          {componentProps.render!(() => outProps(renderFnProps), state)}
        </Match>
        <Match when={enabled() && componentProps.render == null && element != null}>
          <Dynamic component={element as keyof JSX.IntrinsicElements} {...outProps(renderFnProps)}>
            {safeChildren()}
          </Dynamic>
        </Match>
      </Switch>
    );
  };
}

// https://github.com/solidjs/solid/issues/2478#issuecomment-2888503241
function childrenLazy(props: any, params: any) {
  const _s = Symbol();
  let x: any = props.render != null ? children(() => props.children ?? params.children) : _s;
  return () => {
    x = x === _s ? children(() => props.children ?? params.children) : x;
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
  > {
    /**
     * The class name to apply to the rendered element.
     * Can be a string or a function that accepts the state and returns a string.
     */
    class?: string | ((state: Accessor<State>) => string);
    /**
     * The render prop or Solid element to override the default element.
     */
    render?: ComponentRenderFn<Record<string, unknown>, State> | null;
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
