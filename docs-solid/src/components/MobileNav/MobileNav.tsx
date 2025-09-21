import { Dialog } from '@base-ui-components/solid/dialog';
import { useScrollLock } from '@base-ui-components/solid/utils';
import { A } from '@solidjs/router';
import clsx from 'clsx';
import {
  createContext,
  createSignal,
  onMount,
  useContext,
  type ComponentProps,
  type ParentProps,
} from 'solid-js';
import { HEADER_HEIGHT } from '../Header';

const MobileNavStateCallback = createContext<(open: boolean) => void>(() => undefined);

export function Root(props: Dialog.Root.Props) {
  const [open, setOpen] = createSignal(false);

  return (
    <MobileNavStateCallback.Provider value={setOpen}>
      <Dialog.Root open={open} onOpenChange={setOpen} {...props} />
    </MobileNavStateCallback.Provider>
  );
}

export const Trigger = Dialog.Trigger;

export function Backdrop(props: Dialog.Backdrop.Props) {
  return <Dialog.Backdrop {...props} class={clsx('MobileNavBackdrop', props.class)} />;
}

export const Portal = Dialog.Portal;

export function Popup(props: Dialog.Popup.Props) {
  return (
    <Dialog.Popup {...props} class={clsx('MobileNavPopup', props.class)}>
      <PopupImpl>{props.children}</PopupImpl>
    </Dialog.Popup>
  );
}

function PopupImpl(props: ParentProps) {
  const [forceScrollLock, setForceScrollLock] = createSignal(false);
  const [rem, setRem] = createSignal(16);
  const setOpen = useContext(MobileNavStateCallback);

  useScrollLock({ enabled: forceScrollLock, open: forceScrollLock, mounted: forceScrollLock });

  onMount(() => {
    setRem(parseFloat(getComputedStyle(document.documentElement).fontSize));
  });

  return (
    <>
      <div class="MobileNavBottomOverscroll" />
      <div
        class="MobileNavViewport"
        onScroll={(event) => {
          const viewport = event.currentTarget;
          if (viewport.scrollTop > (HEADER_HEIGHT * rem()) / 16) {
            viewport.setAttribute('data-clipped', '');
          } else {
            viewport.removeAttribute('data-clipped');
          }
        }}
        onTouchStart={(event) => {
          const viewport = event.currentTarget;

          // Consider flicks from scroll top only (iOS does the same with its sheets)
          if (viewport.scrollTop <= 0) {
            viewport.addEventListener(
              'touchend',
              function handleTouchEnd() {
                // If touch ended and we are overscrolling past a threshold...
                if (viewport.scrollTop < -32) {
                  const y = viewport.scrollTop;
                  // Scroll lock is forced during the flick down gesture to maintain
                  // a continous blend between the native scroll inertia and our own animation
                  setForceScrollLock(true);

                  viewport.addEventListener(
                    'scroll',
                    function handleNextScroll() {
                      // ...look at whether the system's intertia scrolling is continuing the motion
                      // in the same direction. If so, the flick is strong enough to close the dialog.
                      if (viewport.scrollTop < y) {
                        // It's gonna eventually bounce back to scrollTop 0. We need to counteract this
                        // a bit so that the close transition doesn't appear slower than it should.
                        viewport.style.translate = `0px -${y}px`;
                        viewport.style.transform = `400ms`;
                        setOpen(false);

                        // Sometimes the first scroll event comes with the same scroll position
                        // If so, give it another chance, call ourselves recursively
                      } else if (viewport.scrollTop === y) {
                        viewport.addEventListener('scroll', handleNextScroll, { once: true });
                      } else {
                        setForceScrollLock(false);
                      }
                    },
                    { once: true },
                  );
                }
              },
              { once: true },
            );
          }
        }}
      >
        <div class="MobileNavViewportInner">
          {/* We need the area behind the panel to close on tap but also to scroll the viewport. */}
          <Dialog.Close
            class="MobileNavBackdropTapArea"
            tabIndex={-1}
            render={(props) => <div {...props} />}
          />

          <nav class="MobileNavPanel">
            {/* Reverse order to place the close button at the end of the DOM, but at sticky top visually */}
            <div class="flex flex-col-reverse">
              <div>{props.children}</div>
              <div class="MobileNavCloseContainer">
                <Dialog.Close aria-label="Close the navigation" class="MobileNavClose">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0.75 0.75L6 6M11.25 11.25L6 6M6 6L0.75 11.25M6 6L11.25 0.75"
                      stroke="currentcolor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </Dialog.Close>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}

export function Section(props: ComponentProps<'div'>) {
  return <div {...props} class={clsx('MobileNavSection', props.class)} />;
}

export function Heading(props: ComponentProps<'div'>) {
  return (
    <div {...props} class={clsx('MobileNavHeading', props.class)}>
      <div class="MobileNavHeadingInner">{props.children}</div>
    </div>
  );
}

export function List(props: ComponentProps<'ul'>) {
  return <ul {...props} class={clsx('MobileNavList', props.class)} />;
}

export function Badge(props: ComponentProps<'span'>) {
  return <span {...props} class={clsx('MobileNavBadge', props.class)} />;
}

export function Label(props: ComponentProps<'span'>) {
  return <span {...props} class={clsx('MobileNavLabel', props.class)} />;
}

export interface ItemProps extends ComponentProps<'li'> {
  active?: boolean;
  href: string;
  rel?: string;
}

export function Item(props: ItemProps) {
  const setOpen = useContext(MobileNavStateCallback);
  return (
    <li {...props} class={clsx('MobileNavItem', props.class)}>
      <A
        aria-current={props.active ? 'page' : undefined}
        class="MobileNavLink"
        href={props.href}
        rel={props.rel}
        // We handle scroll manually
        noScroll
        onClick={() => {
          if (props.href === window.location.pathname) {
            // If the URL is the same, close, wait a little, and scroll to top smoothly
            setOpen(false);
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 500);
          } else {
            // Otherwise, wait for the URL change before closing and scroll up instantly
            onUrlChange(() => {
              setOpen(false);
              window.scrollTo({ top: 0, behavior: 'instant' });
            });
          }
        }}
      >
        {props.children}
      </A>
    </li>
  );
}

function onUrlChange(callback: () => void) {
  const initialUrl = window.location.href;

  function rafRecursively() {
    requestAnimationFrame(() => {
      if (initialUrl === window.location.href) {
        rafRecursively();
      } else {
        callback();
      }
    });
  }

  rafRecursively();
}
