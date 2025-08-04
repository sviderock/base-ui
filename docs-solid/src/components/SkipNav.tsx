import type { ComponentProps } from 'solid-js';

export const MAIN_CONTENT_ID = 'main-content';
const HREF = `#${MAIN_CONTENT_ID}`;

export function SkipNav(props: ComponentProps<'a'>) {
  return <a class="SkipNav" href={HREF} {...props} />;
}
