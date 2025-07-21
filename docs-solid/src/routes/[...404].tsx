import { Title } from '@solidjs/meta';
import { Link } from 'docs-solid/src/components/Link';
import { Logo } from 'docs-solid/src/components/Logo';
import { ArrowRightIcon } from 'docs-solid/src/icons/ArrowRightIcon';
import RootLayout from './(public).tsx';
import './404.css';

export default function NotFound() {
  return (
    <RootLayout>
      <Title>Not Found</Title>
      <div class="NotFoundRoot">
        <div class="NotFoundContent">
          <Logo class="mb-8 ml-px" aria-label="Base UI" />
          <h1 class="NotFoundHeading">404</h1>
          <p class="NotFoundCaption">
            This page couldn't be found. Please return to the docs or create a corresponding issue
            on GitHub.
          </p>
          <div class="flex flex-col items-start gap-2">
            <Link
              class="-m-1 inline-flex items-center gap-1 p-1"
              href="/react/overview/quick-start"
            >
              Documentation <ArrowRightIcon />
            </Link>

            <Link class="-m-1 p-1" href="https://github.com/mui/base-ui">
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
