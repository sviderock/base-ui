import {
  children,
  createEffect,
  createMemo,
  Match,
  mergeProps,
  onCleanup,
  onMount,
  Show,
  splitProps,
  Switch,
  type JSX,
  type Ref,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { mergePropsN } from '../merge-props';
import { access, type MaybeAccessor } from '../solid-helpers';
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
  element: MaybeAccessor<TagName>;
  // TODO: needed as a separate prop to properly reassign refs https://stackoverflow.com/a/71137252
  ref: Ref<RenderedElementType | null | undefined>;
  componentProps: RenderElement.ComponentProps<State>;
  params: RenderElement.Parameters<State, TagName, Enabled>;
}): JSX.Element {
  const element = () => access(props.element);
  const state = () => access(props.params.state) ?? (EMPTY_OBJECT as State);
  const enabled = () => access(props.params.enabled) ?? true;
  const classProp = () => access(props.componentProps.class);
  const renderProp = () => access(props.componentProps.render);
  const disableStyleHooks = () => access(props.params.disableStyleHooks);
  const customStyleHookMapping = () => access(props.params.customStyleHookMapping);
  const paramsProps = () => access(props.params.props);

  const styleHooks = createMemo((): Record<string, string> | undefined => {
    if (disableStyleHooks() !== true) {
      return enabled()
        ? getStyleHookProps(state(), customStyleHookMapping() as CustomStyleHookMapping<State>)
        : EMPTY_OBJECT;
    }
    return undefined;
  });

  const propsParams = createMemo(() => {
    const p = paramsProps();
    const mergedParams = Array.isArray(p) ? mergePropsN(p) : p;

    if (mergedParams === undefined) {
      return undefined;
    }

    const [local, rest] = splitProps(mergedParams, ['children']);
    const safeChildren = children(() => {
      if (typeof element() === 'string') {
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
        class: resolveClassName(classProp(), state()),
        ref: props.ref,
      });

      return mergedProps as JSX.HTMLAttributes<any>;
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

      <Match when={element() && typeof element() === 'string'}>
        <Dynamic
          component={element() as keyof JSX.IntrinsicElements}
          {...(element() === 'button' ? { type: 'button' } : {})}
          {...(element() === 'img' ? { alt: '' } : {})}
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
    enabled?: MaybeAccessor<Enabled | undefined>;
    /**
     * @deprecated
     */
    propGetter?: (externalProps: HTMLProps) => HTMLProps;
    /**
     * The state of the component.
     */
    state?: MaybeAccessor<State | undefined>;

    /**
     * Intrinsic props to be spread on the rendered element.
     */
    props?: MaybeAccessor<
      | RenderFunctionProps<TagName>
      | Array<
          | RenderFunctionProps<TagName>
          | undefined
          | ((props: RenderFunctionProps<TagName>) => RenderFunctionProps<TagName>)
        >
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
        disableStyleHooks: MaybeAccessor<true>;
      }
    | {
        /**
         * Disable style hook mapping.
         */
        disableStyleHooks?: MaybeAccessor<false | undefined>;
      }
  );

  export interface ComponentProps<State> {
    /**
     * The class name to apply to the rendered element.
     * Can be a string or a function that accepts the state and returns a string.
     */
    class?: MaybeAccessor<string | ((state: State) => string)>;
    /**
     * The render prop or Solid element to override the default element.
     */
    render?: MaybeAccessor<ComponentRenderFn<Record<string, unknown>, State> | JSX.Element>;
  }
}
