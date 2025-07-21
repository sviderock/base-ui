import { queries, render as testingLibraryRender } from '@solidjs/testing-library';
import { userEvent } from '@testing-library/user-event';
import { type Component } from 'solid-js';
import { createDynamic } from 'solid-js/web';
import { customQueries, type MuiRenderResult, type RenderOptions } from './describeConformance';

export type BaseUIRenderResult = MuiRenderResult;

interface DataAttributes {
  [key: `data-${string}`]: string | undefined;
}

type BaseUITestRenderer = {
  render: (
    element: Component,
    elementProps?: DataAttributes,
    options?: RenderOptions,
  ) => BaseUIRenderResult;
};

export function createRenderer(): BaseUITestRenderer {
  return {
    render(element, elementProps = {}, options = {}) {
      return {
        ...(testingLibraryRender(() => createDynamic(() => element, elementProps), {
          ...options,
          queries: { ...queries, ...customQueries },
        }) as any),
        user: userEvent.setup(),
      };
    },
  };
}
