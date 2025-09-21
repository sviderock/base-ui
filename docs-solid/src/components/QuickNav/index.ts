import { clientOnly } from '@solidjs/start';

export default {
  Container: clientOnly(async () => ({ default: (await import('./QuickNav')).Container })),
  Root: clientOnly(async () => ({ default: (await import('./QuickNav')).Root })),
  Title: clientOnly(async () => ({ default: (await import('./QuickNav')).Title })),
  List: clientOnly(async () => ({ default: (await import('./QuickNav')).List })),
  Item: clientOnly(async () => ({ default: (await import('./QuickNav')).Item })),
  Link: clientOnly(async () => ({ default: (await import('./QuickNav')).Link })),
};
