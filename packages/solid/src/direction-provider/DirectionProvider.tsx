'use client';
import { type JSX } from 'solid-js';
import { DirectionContext, type TextDirection } from './DirectionContext';

/**
 * Enables RTL behavior for Base UI components.
 *
 * Documentation: [Base UI Direction Provider](https://base-ui.com/react/utils/direction-provider)
 */
export function DirectionProvider(props: DirectionProvider.Props) {
  const direction = () => props.direction ?? 'ltr';
  return (
    <DirectionContext.Provider value={{ direction }}>{props.children}</DirectionContext.Provider>
  );
}

export namespace DirectionProvider {
  export interface Props {
    children?: JSX.Element;
    /**
     * The reading direction of the text
     * @default 'ltr'
     */
    direction?: TextDirection;
  }
}
