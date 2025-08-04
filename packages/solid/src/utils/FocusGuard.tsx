'use client';

import { createSignal, onMount, type ComponentProps } from 'solid-js';
import { isSafari } from './detectBrowser';
import { visuallyHidden } from './visuallyHidden';

/**
 * @internal
 */
export function FocusGuard(props: ComponentProps<'span'>) {
  const [role, setRole] = createSignal<'button' | undefined>();

  onMount(() => {
    if (isSafari) {
      // Unlike other screen readers such as NVDA and JAWS, the virtual cursor
      // on VoiceOver does trigger the onFocus event, so we can use the focus
      // trap element. On Safari, only buttons trigger the onFocus event.
      setRole('button');
    }
  });

  return (
    <span
      {...props}
      ref={props.ref}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role={role()}
      aria-hidden={role() ? undefined : true}
      style={visuallyHidden}
      data-base-ui-focus-guard=""
    />
  );
}
