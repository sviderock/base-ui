import { A } from '@solidjs/router';
import { GitHubIcon } from 'docs-solid/src/icons/GitHubIcon';
import { nav } from 'docs-solid/src/nav';
import { For } from 'solid-js';
import { NpmIcon } from '../icons/NpmIcon';
import { Logo } from './Logo';
import MobileNav from './MobileNav';
import { SkipNav } from './SkipNav';

const VERSION = process.env.LIB_VERSION;
export const HEADER_HEIGHT = 48;

export function Header() {
  return (
    <div class="Header">
      <div class="HeaderInner">
        <SkipNav>Skip to contents</SkipNav>
        <A href="/" class="HeaderLogoLink">
          <Logo aria-label="Base UI" />
        </A>

        <div class="flex gap-6 max-show-side-nav:hidden">
          <A href="/careers/design-engineer" class="HeaderLink">
            Careers
          </A>
          <a
            class="HeaderLink"
            href="https://www.npmjs.com/package/@base-ui-components/react"
            rel="noopener"
          >
            <NpmIcon />
            {VERSION}
          </a>
          <a class="HeaderLink" href="https://github.com/mui/base-ui" rel="noopener">
            <GitHubIcon />
            GitHub
          </a>
        </div>

        <div class="flex show-side-nav:hidden">
          <MobileNav.Root>
            <MobileNav.Trigger class="HeaderButton">
              <div class="flex w-4 flex-col items-center gap-1">
                <div class="h-0.5 w-3.5 bg-current" />
                <div class="h-0.5 w-3.5 bg-current" />
              </div>
              Navigation
            </MobileNav.Trigger>
            <MobileNav.Portal>
              <MobileNav.Backdrop />
              <MobileNav.Popup>
                <For each={nav}>
                  {(section) => (
                    <MobileNav.Section>
                      <MobileNav.Heading>{section.label}</MobileNav.Heading>
                      <MobileNav.List>
                        <For each={section.links}>
                          {(link) => (
                            <MobileNav.Item href={link.href}>
                              <MobileNav.Label>{link.label}</MobileNav.Label>
                              {link.isNew && <MobileNav.Badge>New</MobileNav.Badge>}
                            </MobileNav.Item>
                          )}
                        </For>
                      </MobileNav.List>
                    </MobileNav.Section>
                  )}
                </For>

                <MobileNav.Section>
                  <MobileNav.Heading>Resources</MobileNav.Heading>
                  <MobileNav.List>
                    <MobileNav.Item href="/careers/design-engineer" rel="noopener">
                      <span class="flex flex-grow-1 items-baseline justify-between">Careers</span>
                    </MobileNav.Item>
                    <MobileNav.Item
                      href="https://www.npmjs.com/package/@base-ui-components/react"
                      rel="noopener"
                    >
                      <NpmIcon />
                      <span class="flex flex-grow-1 items-baseline justify-between">
                        npm package
                        <span class="text-md text-gray-600">{VERSION}</span>
                      </span>
                    </MobileNav.Item>
                    <MobileNav.Item href="https://github.com/mui/base-ui" rel="noopener">
                      <GitHubIcon class="mt-[-2px]" />
                      GitHub
                    </MobileNav.Item>
                  </MobileNav.List>
                </MobileNav.Section>
              </MobileNav.Popup>
            </MobileNav.Portal>
          </MobileNav.Root>
        </div>
      </div>
    </div>
  );
}
