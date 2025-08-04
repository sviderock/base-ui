import { GitHubIcon } from 'docs-solid/src/icons/GitHubIcon';
import { NpmIcon } from '../icons/NpmIcon';
import { Logo } from './Logo';
// import * as MobileNav from './MobileNav';
import { A } from '@solidjs/router';
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

        {/* <div class="flex show-side-nav:hidden">
          <MobileNav.Root>
            <MobileNav.Trigger className="HeaderButton">
              <div className="flex w-4 flex-col items-center gap-1">
                <div className="h-0.5 w-3.5 bg-current" />
                <div className="h-0.5 w-3.5 bg-current" />
              </div>
              Navigation
            </MobileNav.Trigger>
            <MobileNav.Portal>
              <MobileNav.Backdrop />
              <MobileNav.Popup>
                {nav.map((section) => (
                  <MobileNav.Section key={section.label}>
                    <MobileNav.Heading>{section.label}</MobileNav.Heading>
                    <MobileNav.List>
                      {section.links.map((link) => (
                        <MobileNav.Item key={link.href} href={link.href}>
                          <MobileNav.Label>{link.label}</MobileNav.Label>
                          {link.isNew && <MobileNav.Badge>New</MobileNav.Badge>}
                        </MobileNav.Item>
                      ))}
                    </MobileNav.List>
                  </MobileNav.Section>
                ))}

                <MobileNav.Section>
                  <MobileNav.Heading>Resources</MobileNav.Heading>
                  <MobileNav.List>
                    <MobileNav.Item href="/careers/design-engineer" rel="noopener">
                      <span className="flex flex-grow-1 items-baseline justify-between">
                        Careers
                      </span>
                    </MobileNav.Item>
                    <MobileNav.Item
                      href="https://www.npmjs.com/package/@base-ui-components/react"
                      rel="noopener"
                    >
                      <NpmIcon />
                      <span className="flex flex-grow-1 items-baseline justify-between">
                        npm package
                        <span className="text-md text-gray-600">{VERSION}</span>
                      </span>
                    </MobileNav.Item>
                    <MobileNav.Item href="https://github.com/mui/base-ui" rel="noopener">
                      <GitHubIcon className="mt-[-2px]" />
                      GitHub
                    </MobileNav.Item>
                  </MobileNav.List>
                </MobileNav.Section>
              </MobileNav.Popup>
            </MobileNav.Portal>
          </MobileNav.Root>
        </div> */}
      </div>
    </div>
  );
}
