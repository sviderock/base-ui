import solidPlugin from 'vite-plugin-solid';
import { defineProject, mergeConfig } from 'vitest/config';
// eslint-disable-next-line import/no-relative-packages
import sharedConfig from '../../vitest.shared.mts';

export default mergeConfig(
  sharedConfig,
  defineProject({
    define: {
      'process.env.NODE_ENV': JSON.stringify('test'),
    },
    plugins: [solidPlugin()],
  }),
);
