'use client';
import { useMediaQuery } from '@base-ui-components/solid/unstable-use-media-query';
import { createEffect, on, onCleanup, onMount } from 'solid-js';

let boundDataGaListener = false;

/**
 * basically just a `useAnalytics` hook.
 * However, it needs the redux store which is created
 * in the same component this "hook" is used.
 */
export function GoogleAnalytics(props: GoogleAnalytics.Props) {
  onMount(() => {
    // @ts-expect-error
    window.dataLayer = window.dataLayer || [];

    function gtag(...args: unknown[]) {
      // @ts-expect-error
      window.dataLayer.push([...args]);
    }

    window.gtag = gtag;

    gtag('js', new Date());

    // eslint-disable-next-line no-template-curly-in-string
    gtag('config', '${id}', {
      send_page_view: false,
    });
  });

  onMount(() => {
    if (!boundDataGaListener) {
      boundDataGaListener = true;
      document.addEventListener('click', handleDocumentClick);
    }
  });

  let timeout = null as NodeJS.Timeout | null;

  createEffect(
    on([() => props.currentRoute, () => props.productCategoryId, () => props.productId], () => {
      // Wait for the title to be updated.
      // React fires useEffect twice in dev mode
      clearTimeout(timeout ?? undefined);
      timeout = setTimeout(() => {
        // Remove hash as it's never sent to the server
        // https://github.com/vercel/next.js/issues/25202
        const canonicalAsServer = window.location.pathname.replace(/#(.*)$/, '');

        // https://developers.google.com/analytics/devguides/collection/ga4/views?client_type=gtag
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_location: canonicalAsServer,
          productId: props.productId,
          productCategoryId: props.productCategoryId,
        });
      });
    }),
  );

  createEffect(() => {
    window.gtag('set', 'user_properties', {
      codeVariant: props.codeLanguage,
    });
  });

  createEffect(() => {
    window.gtag('set', 'user_properties', {
      codeStylingVariant: props.codeStylingVariant,
    });
  });

  createEffect(() => {
    window.gtag('set', 'user_properties', {
      userLanguage: props.userLanguage,
    });
  });

  onMount(() => {
    /**
     * Based on https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#Monitoring_screen_resolution_or_zoom_level_changes
     * Adjusted to track 3 or more different ratios
     */
    function trackDevicePixelRatio() {
      const devicePixelRatio = Math.round(window.devicePixelRatio * 10) / 10;
      window.gtag('set', 'user_properties', {
        devicePixelRatio,
      });
    }

    trackDevicePixelRatio();

    const matchMedia: MediaQueryList = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`,
    );

    matchMedia.addEventListener('change', trackDevicePixelRatio);
    onCleanup(() => {
      matchMedia.removeEventListener('change', trackDevicePixelRatio);
    });
  });

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const preferredColorScheme = () => (prefersDarkMode() ? 'dark' : 'light');

  createEffect(() => {
    window.gtag('set', 'user_properties', {
      colorSchemeOS: preferredColorScheme(),
    });
  });
}

export namespace GoogleAnalytics {
  export interface Props {
    productId: string;
    productCategoryId: string;
    codeStylingVariant: string;
    codeLanguage: string;
    currentRoute: string;
    packageManager: string;
    userLanguage: string;
  }
}

// So we can write code like:
//
// <Button
//   data-ga-event-category="demo"
//   data-ga-event-action="expand"
// >
//   Foo
// </Button>
function handleDocumentClick(event: MouseEvent) {
  let node = event.target as Node | null;

  while (node && node !== document) {
    const element: Element | null = node as Element;
    const category = (element as Element).getAttribute('data-ga-event-category');

    // We reach a tracking element, no need to look higher in the dom tree.
    if (category) {
      const split = parseFloat(element.getAttribute('data-ga-event-split') ?? '0');

      if (split && split < Math.random()) {
        return;
      }

      window.gtag('event', category, {
        eventAction: element.getAttribute('data-ga-event-action'),
        eventLabel: element.getAttribute('data-ga-event-label'),
      });
      break;
    }

    node = element.parentElement;
  }
}
