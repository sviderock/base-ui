import { Header } from 'docs-solid/src/components/Header';
import * as QuickNav from 'docs-solid/src/components/QuickNav/QuickNav';
import * as SideNav from 'docs-solid/src/components/SideNav';
import { MAIN_CONTENT_ID } from 'docs-solid/src/components/SkipNav';
import { nav } from 'docs-solid/src/nav';
import { For, type ParentProps } from 'solid-js';
import './(content).css';

export default function Layout(props: ParentProps) {
  return (
    <div class="ContentLayoutRoot">
      <Header />
      <SideNav.Root>
        <For each={nav}>
          {(section) => (
            <SideNav.Section>
              <SideNav.Heading>{section.label}</SideNav.Heading>
              <SideNav.List>
                <For each={section.links}>
                  {(link) => (
                    <SideNav.Item href={link.href}>
                      <SideNav.Label>{link.label}</SideNav.Label>
                      {link.isNew && <SideNav.Badge>New</SideNav.Badge>}
                    </SideNav.Item>
                  )}
                </For>
              </SideNav.List>
            </SideNav.Section>
          )}
        </For>
      </SideNav.Root>
      <main class="ContentLayoutMain" id={MAIN_CONTENT_ID}>
        <QuickNav.Container>{props.children}</QuickNav.Container>
      </main>
    </div>
  );
}

// TODO: Add metadata
// Title and description are pulled from <h1> and <Subtitle> in the MDX.
// export const metadata: Metadata = {
//   title: null,
//   description: null,
// };
