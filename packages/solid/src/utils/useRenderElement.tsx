import {
  children,
  createMemo,
  Match,
  mergeProps,
  Show,
  splitProps,
  Switch,
  type JSX,
  type Ref,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { mergePropsN } from '../merge-props';
import { EMPTY_OBJECT } from './constants';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { resolveClassName } from './resolveClassName';
import type { ComponentRenderFn, HTMLProps } from './types';

type IntrinsicTagName = keyof JSX.IntrinsicElements;

export function RenderElement<
  State extends Record<string, any>,
  RenderedElementType extends HTMLElement,
  TagName extends IntrinsicTagName | undefined,
  Enabled extends boolean | undefined = undefined,
>(props: {
  element: TagName;
  // TODO: needed as a separate prop to properly reassign refs https://stackoverflow.com/a/71137252
  ref: Ref<RenderedElementType | null | undefined>;
  componentProps: RenderElement.ComponentProps<State>;
  params: RenderElement.Parameters<State, TagName, Enabled>;
}): JSX.Element {
  const state = () => props.params.state ?? (EMPTY_OBJECT as State);
  const enabled = () => props.params.enabled ?? true;

  const styleHooks = createMemo((): Record<string, string> | undefined => {
    if (props.params.disableStyleHooks !== true) {
      return enabled()
        ? getStyleHookProps(state(), props.params.customStyleHookMapping)
        : EMPTY_OBJECT;
    }
    return undefined;
  });

  const flattenedPropsParams = createMemo(() =>
    Array.isArray(props.params.props) ? mergePropsN(props.params.props) : props.params.props,
  );

  const propsParams = createMemo(() => {
    const mergedParams = flattenedPropsParams();
    if (mergedParams === undefined) {
      return undefined;
    }

    if ('render' in mergedParams) {
      const { render, ...rest } = mergedParams;
      return rest;
    }

    const [local, rest] = splitProps(mergedParams, ['children']);
    const safeChildren = children(() => {
      if (typeof props.element === 'string') {
        return local.children;
      }

      return false;
    });

    return {
      ...rest,
      children: safeChildren,
    };
  });

  const outProps = createMemo((): JSX.HTMLAttributes<any> => {
    if (enabled()) {
      const mergedProps = mergeProps(styleHooks(), propsParams(), {
        class: resolveClassName(props.componentProps.class, state()),
        ref: props.ref,
      });

      return mergedProps as JSX.HTMLAttributes<any>;
    }

    return EMPTY_OBJECT;
  });

  return (
    <Switch>
      <Match when={enabled() === false}>{null}</Match>

      <Match when={props.componentProps.render}>
        <Show
          when={typeof props.componentProps.render === 'function' && props.componentProps.render}
          fallback={props.componentProps.render as JSX.Element}
        >
          {(renderer) => {
            const render = renderer();
            outProps().ref = props.ref;
            const element = render(outProps() as any, state());
            return element;
          }}
        </Show>
      </Match>

      <Match when={props.element && typeof props.element === 'string'}>
        <Dynamic
          component={props.element as keyof JSX.IntrinsicElements}
          {...(props.element === 'button' ? { type: 'button' } : {})}
          {...(props.element === 'img' ? { alt: '' } : {})}
          {...outProps()}
        />
      </Match>
    </Switch>
  );
}

type RenderFunctionProps<TagName> = TagName extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[TagName]
  : JSX.HTMLAttributes<any>;

export namespace RenderElement {
  export type Parameters<State, TagName, Enabled extends boolean | undefined> = {
    /**
     * If `false`, the hook will skip most of its internal logic and return `null`.
     * This is useful for rendering a component conditionally.
     * @default true
     */
    enabled?: Enabled;
    /**
     * @deprecated
     */
    propGetter?: (externalProps: HTMLProps) => HTMLProps;
    /**
     * The state of the component.
     */
    state?: State;

    /**
     * Intrinsic props to be spread on the rendered element.
     */
    props?:
      | RenderFunctionProps<TagName>
      | Array<
          | RenderFunctionProps<TagName>
          | undefined
          | ((props: RenderFunctionProps<TagName>) => RenderFunctionProps<TagName>)
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

  export interface ComponentProps<State> {
    /**
     * The class name to apply to the rendered element.
     * Can be a string or a function that accepts the state and returns a string.
     */
    class?: string | ((state: State) => string);
    /**
     * The render prop or Solid element to override the default element.
     */
    render?: ComponentRenderFn<Record<string, unknown>, State> | JSX.Element;
  }
}
