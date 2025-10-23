'use client';
import { useLocation } from '@solidjs/router';
import { createMemo } from 'solid-js';
import { GoogleAnalytics as BaseGoogleAnalytics } from '../blocks/GoogleAnalytics';
import { GoogleTagManager } from '../blocks/GoogleTagManager';
import { usePackageManagerSnippetContext } from '../blocks/PackageManagerSnippet/PackageManagerSnippetProvider';
import { useDemoVariantSelectorContext } from './Demo/DemoVariantSelectorProvider';

const PRODUCTION_GA =
  process.env.DEPLOY_ENV === 'production' || process.env.DEPLOY_ENV === 'staging';
const GOOGLE_ANALYTICS_ID_V4 = PRODUCTION_GA ? 'G-5NXDQLC2ZK' : 'G-XJ83JQEK7J';

export function GoogleAnalytics() {
  const location = useLocation();
  const currentRoute = createMemo(() => location.pathname);
  const demoVariantSelectorContext = useDemoVariantSelectorContext();
  const packageManagerSnippetContext = usePackageManagerSnippetContext();

  return (
    <>
      <GoogleTagManager id={GOOGLE_ANALYTICS_ID_V4} />
      <BaseGoogleAnalytics
        productId="base-ui"
        productCategoryId="core"
        currentRoute={currentRoute()}
        codeLanguage={demoVariantSelectorContext.selectedLanguage()}
        codeStylingVariant={demoVariantSelectorContext.selectedVariant()}
        packageManager={packageManagerSnippetContext.packageManager()}
        userLanguage="en"
      />
    </>
  );
}
