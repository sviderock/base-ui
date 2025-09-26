import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import 'docs-solid/src/app.css';
import { Suspense } from 'solid-js';
// @ts-ignore
import { MDXProvider } from 'solid-mdx';
import './app.css';
import { mdxComponents } from './mdx-components';

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <MDXProvider components={mdxComponents}>
            <Suspense>{props.children}</Suspense>
          </MDXProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
