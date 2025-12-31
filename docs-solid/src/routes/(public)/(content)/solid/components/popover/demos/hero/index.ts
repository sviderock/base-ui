import { clientOnly } from '@solidjs/start';

export default {
  CssModules: clientOnly(async () => ({ default: (await import('./css-modules')).default }), {
    lazy: true,
  }),
  Tailwind: clientOnly(async () => ({ default: (await import('./tailwind')).default }), {
    lazy: true,
  }),
};
