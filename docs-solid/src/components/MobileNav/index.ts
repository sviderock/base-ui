import { clientOnly } from '@solidjs/start';

export default {
  Root: clientOnly(async () => ({ default: (await import('./MobileNav')).Root })),
  Trigger: clientOnly(async () => ({ default: (await import('./MobileNav')).Trigger })),
  Backdrop: clientOnly(async () => ({ default: (await import('./MobileNav')).Backdrop })),
  Portal: clientOnly(async () => ({ default: (await import('./MobileNav')).Portal })),
  Popup: clientOnly(async () => ({ default: (await import('./MobileNav')).Popup })),
  Section: clientOnly(async () => ({ default: (await import('./MobileNav')).Section })),
  Heading: clientOnly(async () => ({ default: (await import('./MobileNav')).Heading })),
  List: clientOnly(async () => ({ default: (await import('./MobileNav')).List })),
  Badge: clientOnly(async () => ({ default: (await import('./MobileNav')).Badge })),
  Label: clientOnly(async () => ({ default: (await import('./MobileNav')).Label })),
  Item: clientOnly(async () => ({ default: (await import('./MobileNav')).Item })),
};
