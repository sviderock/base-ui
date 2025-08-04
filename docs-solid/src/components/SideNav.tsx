'use client';
import { ScrollArea } from '@base-ui-components/solid/scroll-area';
import { A, useLocation } from '@solidjs/router';
import clsx from 'clsx';
import scrollIntoView from 'scroll-into-view-if-needed';
import { createEffect, onMount, splitProps, type ComponentProps } from 'solid-js';
import { HEADER_HEIGHT } from './Header';

export function Root(props: ComponentProps<'nav'>) {
  return (
    <nav aria-label="Main navigation" {...props} class={clsx('SideNavRoot', props.class)}>
      <ScrollArea.Root>
        <ScrollArea.Viewport data-side-nav-viewport class="SideNavViewport">
          {props.children}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar class="SideNavScrollbar" orientation="vertical">
          <ScrollArea.Thumb class="SideNavScrollbarThumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </nav>
  );
}

export function Section(props: ComponentProps<'div'>) {
  return <div {...props} class={clsx('SideNavSection', props.class)} />;
}

export function Heading(props: ComponentProps<'div'>) {
  return <div {...props} class={clsx('SideNavHeading', props.class)} />;
}

export function List(props: ComponentProps<'ul'>) {
  return <ul {...props} class={clsx('SideNavList', props.class)} />;
}

export function Label(props: ComponentProps<'span'>) {
  return <span {...props} class={clsx('SideNavLabel', props.class)} />;
}

export function Badge(props: ComponentProps<'span'>) {
  return <span {...props} class={clsx('SideNavBadge', props.class)} />;
}

interface ItemProps extends ComponentProps<'li'> {
  active?: boolean;
  href: string;
  isNew?: boolean;
}

const SCROLL_MARGIN = 48;

export function Item(props: ItemProps) {
  const [local, itemProps] = splitProps(props, ['children', 'href', 'class']);
  const location = useLocation();
  let rem = 16;
  let ref: HTMLLIElement | undefined;

  const active = () => location.pathname === props.href;

  onMount(() => {
    rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  });

  createEffect(() => {
    if (ref && active()) {
      const scrollMargin = (SCROLL_MARGIN * rem) / 16;
      const headerHeight = (HEADER_HEIGHT * rem) / 16;
      const viewport = document.querySelector('[data-side-nav-viewport]');

      if (!viewport) {
        return;
      }

      scrollIntoView(ref, {
        block: 'nearest',
        scrollMode: 'if-needed',
        boundary: (parent) => viewport.contains(parent),
        behavior: (actions) => {
          actions.forEach(({ top }) => {
            const dir = viewport.scrollTop > top ? -1 : 1;
            const offset = Math.max(0, headerHeight - Math.max(0, window.scrollY));
            viewport.scrollTop = top + offset + scrollMargin * dir;
          });
        },
      });
    }
  });

  return (
    <li ref={ref} {...itemProps} class={clsx('SideNavItem', local.class)}>
      <A
        aria-current={active() ? 'page' : undefined}
        data-active={active() || undefined}
        class="SideNavLink"
        href={local.href}
        noScroll={active()}
        onClick={() => {
          // Scroll to top smoothly when clicking on the currently active item
          if (active()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      >
        {local.children}
      </A>
    </li>
  );
}
