import solid from 'eslint-plugin-solid/configs/typescript';
// @ts-ignore
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
const config = [...defaultConfig, { rules: configWithDisabledReactRules }, { ...solid }];

export default config;
