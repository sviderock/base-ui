import { defineProject, mergeConfig } from 'vitest/config';
// eslint-disable-next-line import/no-relative-packages
import solidPlugin from 'vite-plugin-solid';
import sharedConfig from '../../vitest.shared.mts';

export default mergeConfig(
  sharedConfig,
  defineProject({
    define: {
      'process.env.NODE_ENV': JSON.stringify('test'),
    },
    // resolve: {
    //   dedupe: ['solid-js'],
    //   conditions: ['development', 'browser'],
    // },
    plugins: [solidPlugin()],
    test: {
      retry: 0,
      // testTransformMode: {
      //   web: ['/\.[jt]sx?$/'],
      // },
      browser: {
        // Enable browser-based testing for UI components
        enabled: true,
        headless: true,
        provider: 'playwright',
        instances: [{ browser: 'chromium', name: 'chromium-solid' }],
        screenshotFailures: false,
      },
      // deps: {
      //   optimizer: {
      //     web: { enabled: true },
      //   },
      // },
    },
  }),
);
