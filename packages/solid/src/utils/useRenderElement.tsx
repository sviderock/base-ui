import {
  children,
  createMemo,
  createSignal,
  Match,
  mergeProps,
  onMount,
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

type IntrinsicTagName = keyof HTMLElementTagNameMap;

export function RenderElement<
  State extends Record<string, any>,
  TagName extends IntrinsicTagName | undefined,
  RenderedElementType extends TagName extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[TagName]
    : HTMLElement,
  Enabled extends boolean | undefined = undefined,
>(props: {
  element: TagName;
  // TODO: needed as a separate prop to properly reassign refs https://stackoverflow.com/a/71137252
  ref: Ref<RenderedElementType>;
  componentProps: RenderElement.ComponentProps<State>;
  params: RenderElement.Parameters<State, TagName, RenderedElementType, Enabled>;
}): JSX.Element {
  const state = () => props.params.state ?? (EMPTY_OBJECT as State);
  const enabled = () => props.params.enabled ?? true;
  const classProp = () => props.componentProps.class;
  const renderProp = () => props.componentProps.render;
  const disableStyleHooks = () => props.params.disableStyleHooks;
  const customStyleHookMapping = () => props.params.customStyleHookMapping;
  const paramsProps = () => props.params.props;
  const resolvedChildren = children(() => {
    if (typeof props.element === 'string') {
      return props.componentProps.children;
    }

    return false;
  });

  const styleHooks = createMemo((): Record<string, string> | undefined => {
    if (disableStyleHooks() !== true) {
      return enabled()
        ? getStyleHookProps(state(), customStyleHookMapping() as CustomStyleHookMapping<State>)
        : EMPTY_OBJECT;
    }
    return undefined;
  });

  const flattenedParamsProps = createMemo(() => {
    const p = paramsProps();
    return Array.isArray(p) ? mergePropsN(p) : p;
  });

  const propsParams = createMemo(() => {
    const mergedParams = flattenedParamsProps();

    if (mergedParams === undefined) {
      return undefined;
    }

    const [, rest] = splitProps(mergedParams as JSX.HTMLAttributes<RenderedElementType>, [
      'children',
    ]);

    return {
      ...rest,
      children: resolvedChildren,
    };
  });

  const outProps = createMemo<JSX.HTMLAttributes<any>>(() => {
    if (enabled()) {
      const mergedProps = mergeProps(styleHooks(), propsParams(), {
        class: resolveClassName(classProp(), state()),
        ref: props.ref,
      });

      return mergedProps;
    }

    return EMPTY_OBJECT;
  });

  return (
    <Switch>
      <Match when={enabled() === false}>{null}</Match>

      <Match when={renderProp()}>
        <Show when={typeof renderProp() === 'function'} fallback={renderProp() as JSX.Element}>
          {(renderProp() as Function)(outProps() as any, state())}
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

type RenderFunctionProps<
  TagName,
  RenderedElementType extends TagName extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[TagName]
    : HTMLElement,
> = JSX.HTMLAttributes<RenderedElementType>;

export namespace RenderElement {
  export type Parameters<
    State,
    TagName,
    RenderedElementType extends TagName extends keyof HTMLElementTagNameMap
      ? HTMLElementTagNameMap[TagName]
      : HTMLElement,
    Enabled extends boolean | undefined,
  > = {
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
      | RenderFunctionProps<TagName, RenderedElementType>
      | Array<
          | RenderFunctionProps<TagName, RenderedElementType>
          | undefined
          | ((
              props: RenderFunctionProps<TagName, RenderedElementType>,
            ) => RenderFunctionProps<TagName, RenderedElementType>)
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
    /**
     * The children to render.
     */
    children?: JSX.Element;
  }
}
