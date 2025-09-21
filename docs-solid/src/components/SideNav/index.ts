import { clientOnly } from '@solidjs/start';

export default {
  Root: clientOnly(async () => ({ default: (await import('./SideNav')).Root })),
  Section: clientOnly(async () => ({ default: (await import('./SideNav')).Section })),
  Heading: clientOnly(async () => ({ default: (await import('./SideNav')).Heading })),
  List: clientOnly(async () => ({ default: (await import('./SideNav')).List })),
  Label: clientOnly(async () => ({ default: (await import('./SideNav')).Label })),
  Badge: clientOnly(async () => ({ default: (await import('./SideNav')).Badge })),
  Item: clientOnly(async () => ({ default: (await import('./SideNav')).Item })),
};
