import { A } from '@solidjs/router';
import clsx from 'clsx';
import { ExternalLinkIcon } from 'docs-solid/src/icons/ExternalLinkIcon';
import { Show, splitProps, type ComponentProps } from 'solid-js';

export function Link(props: ComponentProps<typeof A>) {
  const [local, other] = splitProps(props, ['href', 'class']);

  // Sometimes link come from component descriptions; in this case, remove the domain
  const href = () => {
    if (typeof local.href === 'string' && local.href.startsWith('https://base-ui.com')) {
      return local.href.replace('https://base-ui.com', '');
    }

    return local.href;
  };

  return (
    <Show
      when={typeof href() === 'string' && href().startsWith('http')}
      fallback={<A href={href()} class={clsx('Link', local.class)} {...other} />}
    >
      <A
        href={href()}
        target="_blank"
        rel="noopener"
        {...other}
        class={clsx('Link mr-[0.125em] inline-flex items-center gap-[0.25em]', local.class)}
      >
        {other.children}
        <ExternalLinkIcon />
      </A>
    </Show>
  );
}
