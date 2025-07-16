import { createMemo, Match, Show, Switch, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { mergeClasses, mergePropsN } from '../merge-props';
import { EMPTY_OBJECT } from './constants';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { mergeObjects } from './mergeObjects';
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
  componentProps: RenderElement.ComponentProps<State>;
  params: RenderElement.Parameters<State, RenderedElementType, TagName, Enabled>;
}): JSX.Element {
  const state = () => props.params.state ?? (EMPTY_OBJECT as State);
  const enabled = () => props.params.enabled ?? true;
  const className = () =>
    enabled() ? resolveClassName(props.componentProps.class, state()) : undefined;

  const styleHooks = createMemo((): Record<string, string> | undefined => {
    if (props.params.disableStyleHooks !== true) {
      return enabled()
        ? getStyleHookProps(state(), props.params.customStyleHookMapping)
        : EMPTY_OBJECT;
    }
    return undefined;
  });

  const outProps = createMemo((): JSX.HTMLAttributes<any> => {
    if (enabled()) {
      const mergedProps: JSX.HTMLAttributes<any> =
        mergeObjects(
          styleHooks(),
          Array.isArray(props.params.props) ? mergePropsN(props.params.props) : props.params.props,
        ) ?? EMPTY_OBJECT;

      if (className() !== undefined) {
        mergedProps.class = mergeClasses(mergedProps.class, className());
      }

      return mergedProps;
    }

    return EMPTY_OBJECT;
  });

  return (
    <Switch fallback={null}>
      <Match when={enabled() === false}>{null}</Match>

      <Match when={props.componentProps.render}>
        <Show
          when={typeof props.componentProps.render === 'function' && props.componentProps.render}
          fallback={<Dynamic component={() => props.componentProps.render as JSX.Element} />}
        >
          {(renderer) => {
            const element = renderer()(outProps() as any, state());
            return element;
          }}
        </Show>
      </Match>

      <Match when={props.element && typeof props.element === 'string'}>
        <Dynamic
          component={props.element}
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
  export type Parameters<
    State,
    RenderedElementType extends HTMLElement,
    TagName,
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
     * The ref to apply to the rendered element.
     */
    ref?: JSX.HTMLAttributes<RenderedElementType>['ref'];
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
