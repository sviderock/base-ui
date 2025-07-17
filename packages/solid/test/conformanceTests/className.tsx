import { expect } from 'chai';
import type { Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type {
  BaseUiConformanceTestsOptions,
  ConformantComponentProps,
} from '../describeConformance';
import { throwMissingPropError } from './utils';

export function testClassName(
  element: Component<ConformantComponentProps>,
  getOptions: () => BaseUiConformanceTestsOptions,
) {
  describe('prop: className', () => {
    const { render } = getOptions();

    if (!render) {
      throwMissingPropError('render');
    }

    it('should apply the className when passed as a string', async () => {
      await render(() => <Dynamic component={element} class="test-class" />);
      expect(document.querySelector('.test-class')).not.to.equal(null);
    });
  });
}
