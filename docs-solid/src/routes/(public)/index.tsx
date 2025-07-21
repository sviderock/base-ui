import { Link } from 'docs-solid/src/components/Link';
import { Logo } from 'docs-solid/src/components/Logo';
import { ArrowRightIcon } from 'docs-solid/src/icons/ArrowRightIcon';
import './index.css';

export default function Homepage() {
  return (
    <>
      {/* Set the Site name for Google results. https://developers.google.com/search/docs/appearance/site-names */}
      <script
        type="application/ld+json"
        innerHTML={JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Base UI',
          url: 'https://base-ui.com',
        })}
      />
      <div class="HomepageRoot">
        <div class="HomepageContent">
          <Logo class="mb-8 ml-px" aria-label="Base UI" />
          <h1 class="HomepageHeading">
            Unstyled UI components for building accessible web apps and design systems.
          </h1>
          <p class="HomepageCaption">
            From the creators of Radix, Floating&nbsp;UI, and Material&nbsp;UI.
          </p>
          <Link class="-m-1 inline-flex items-center gap-1 p-1" href="/react/overview/quick-start">
            Documentation <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </>
  );
}

// TODO: Add metadata
// const description = 'Unstyled UI components for building accessible web apps and design systems.';
// export const metadata: Metadata = {
//   description,
//   twitter: {
//     description,
//   },
//   openGraph: {
//     description,
//   },
// };
