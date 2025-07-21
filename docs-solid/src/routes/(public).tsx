// import { DocsProviders } from 'docs-solid/src/components/DocsProviders';
import 'docs-solid/src/app.css';
import type { ParentProps } from 'solid-js';
import './(public).css';

export default function Layout(props: ParentProps) {
  return (
    // <DocsProviders>
    <div class="RootLayout">
      <div class="RootLayoutContainer">
        <div class="RootLayoutContent">{props.children}</div>
        <span class="RootLayoutFooter" />
      </div>
    </div>
    // <GoogleAnalytics />
    // </DocsProviders>
  );
}

// TODO: Add metadata
// export const metadata: Metadata = {
//   metadataBase: new URL('https://base-ui.com'),
// };
