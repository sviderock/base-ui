/// <reference types="@solidjs/testing-library" />
import type { render } from '@solidjs/testing-library';

declare global {
  /**
   * When `true`, disables animation-related code, even if supported by the runtime enviroment.
   */
  var BASE_UI_ANIMATIONS_DISABLED: boolean;

  type RenderResult = ReturnType<typeof render>;
}

export type {};

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      autofocus: boolean;
    }
  }
}
