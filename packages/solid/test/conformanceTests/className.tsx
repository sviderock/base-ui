import { expect } from 'chai';
import type { Component } from 'solid-js';
import type {
  BaseUiConformanceTestsOptions,
  ConformantComponentProps,
} from '../describeConformance';
import { throwMissingPropError } from './utils';

export function testClassName<T>(
  element: Component<ConformantComponentProps<T>>,
  getOptions: () => BaseUiConformanceTestsOptions<T>,
) {
  describe('prop: class', () => {
    const { render } = getOptions();

    if (!render) {
      throwMissingPropError('render');
    }

    it('should apply the className when passed as a string', () => {
      render(element, { class: 'test-class' });
      expect(document.querySelector('.test-class')).not.to.equal(null);
    });
  });
}
