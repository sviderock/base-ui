import { children, createMemo, Match, splitProps, Switch, type Accessor, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { mergeProps, mergePropsN } from '../merge-props';
import { access, type MaybeAccessor, type MaybeAccessorValue } from '../solid-helpers';
import { EMPTY_OBJECT } from './constants';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { resolveClassName } from './resolveClassName';
import type { BaseUIComponentProps, ComponentRenderFn, HTMLProps } from './types';

export type ComponentPropsToOmit<State extends Record<string, any>> =
  keyof RenderElement.ComponentProps<State>;

export function RenderElement<
  State extends MaybeAccessor<Record<string, MaybeAccessor<any>>>,
  TagName extends keyof JSX.IntrinsicElements,
  RenderedElementType extends JSX.IntrinsicElements[TagName],
  Enabled extends boolean | undefined = undefined,
>(props: {
  element: TagName;
  // TODO: needed as a separate prop to properly reassign refs https://stackoverflow.com/a/71137252
  ref: RenderedElementType['ref'];
  componentProps: RenderElement.ComponentProps<State>;
  params: RenderElement.Parameters<State, TagName, Enabled>;
  children?: JSX.Element;
}): JSX.Element {
  const state = createMemo(
    () => access(props.params.state) ?? (EMPTY_OBJECT as MaybeAccessorValue<State>),
  );
  const enabled = createMemo(() => props.params.enabled ?? true);
  const renderProp = createMemo(() => props.componentProps.render);
  const resolvedChildren = children(() => props.componentProps.children ?? props.children);

  const styleHooks = createMemo((): Record<string, string> | undefined => {
    if (props.params.disableStyleHooks !== true) {
      return enabled()
        ? getStyleHookProps(state(), props.params.customStyleHookMapping)
        : EMPTY_OBJECT;
    }
    return undefined;
  });

  const outProps = createMemo<JSX.HTMLAttributes<any>>(() => {
    if (enabled() === false) {
      return EMPTY_OBJECT;
    }

    const p = props.params.props;
    const mergedParams = Array.isArray(p) ? mergePropsN(p) : p;
    if (mergedParams === undefined) {
      return EMPTY_OBJECT;
    }

    // TODO: exclude ref from this list
    const [, rest] = splitProps(mergedParams, ['children', 'class', 'ref']);
    const mergedProps = mergeProps(styleHooks(), rest, {
      class: resolveClassName(props.componentProps.class, state()),
      ref: props.ref,
    });

    if (props.componentProps.render) {
      mergedProps.children = resolvedChildren();
    }

    return mergedProps;
  });

  const memoizedRender = createMemo<JSX.Element>(() => {
    if (enabled() === false) {
      return null;
    }

    const cachedRender = renderProp();
    if (cachedRender) {
      return cachedRender(outProps as Accessor<Record<string, unknown>>, state);
    }

    return null;
  }) as unknown as JSX.Element;

  return (
    <Switch>
      <Match when={enabled() === true && props.componentProps.render}>{memoizedRender}</Match>
      <Match when={enabled() === true}>
        <Dynamic
          component={props.element as keyof JSX.IntrinsicElements}
          {...(props.element === 'button' ? { type: 'button' } : {})}
          {...(props.element === 'img' ? { alt: '' } : {})}
          {...outProps()}
        >
          {resolvedChildren()}
        </Dynamic>
      </Match>
    </Switch>
  );
}
export namespace RenderElement {
  export type Parameters<
    State,
    TagName extends keyof JSX.IntrinsicElements,
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
      | BaseUIComponentProps<TagName, State>
      | Array<
          | BaseUIComponentProps<TagName, State>
          | undefined
          | ((props: BaseUIComponentProps<TagName, State>) => BaseUIComponentProps<TagName, State>)
        >;

    /**
     * A mapping of state to style hooks.
     */
    customStyleHookMapping?: CustomStyleHookMapping<MaybeAccessorValue<State>>;
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
    render?: ComponentRenderFn<Record<string, unknown>, State> | null;
    /**
     * The children to render.
     */
    children?: JSX.Element;
  }
}
