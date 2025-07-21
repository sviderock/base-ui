import { expect } from 'chai';
import type { Component, Ref } from 'solid-js';
import type {
  BaseUiConformanceTestsOptions,
  ConformantComponentProps,
} from '../describeConformance';
import { throwMissingPropError } from './utils';

async function verifyRef(
  element: Component<ConformantComponentProps>,
  render: BaseUiConformanceTestsOptions['render'],
  onRef: (instance: unknown, element: HTMLElement | null) => void,
) {
  if (!render) {
    throwMissingPropError('render');
  }

  const props = { ref: null as Ref<any> | undefined };

  const { container } = render(element, props);

  onRef(props.ref, container);
}

export function testRefForwarding(
  element: Component<ConformantComponentProps>,
  getOptions: () => BaseUiConformanceTestsOptions,
) {
  describe('ref', () => {
    it(`attaches the ref`, async () => {
      const { render, refInstanceof } = getOptions();

      await verifyRef(element, render, (instance) => {
        expect(instance).to.be.instanceof(refInstanceof);
      });
    });
  });
}
