import { clientOnly } from '@solidjs/start';

export default {
  Root: clientOnly(async () => ({ default: (await import('./CodeBlock')).Root })),
  Panel: clientOnly(async () => ({ default: (await import('./CodeBlock')).Panel })),
  Pre: clientOnly(async () => ({ default: (await import('./CodeBlock')).Pre })),
};
