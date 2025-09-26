import solid from 'eslint-plugin-solid/configs/typescript';
// @ts-expect-error
// eslint-disable-next-line import/no-relative-packages
import defaultConfig from '../../eslint.config.mjs';

const configWithDisabledReactRules = defaultConfig
  .flatMap((config) =>
    Object.entries(config.rules ?? {})
      .filter(([ruleName]) => ruleName.startsWith('react'))
      .map(([ruleName]) => ruleName),
  )
  .reduce((acc, ruleName) => {
    acc[ruleName] = 'off';
    return acc;
  }, {});

/**
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
  ...defaultConfig,
  // TODO: really annoying suddenly
  { rules: { ...configWithDisabledReactRules, '@typescript-eslint/no-namespace': 'off' } },
  { ...solid },
];

export default config;
