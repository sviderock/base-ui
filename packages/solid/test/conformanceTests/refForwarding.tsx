import { expect } from 'chai';
import type { Component } from 'solid-js';
import type {
  BaseUiConformanceTestsOptions,
  ConformantComponentProps,
} from '../describeConformance';

async function verifyRef(
  element: Component<ConformantComponentProps>,
  render: BaseUiConformanceTestsOptions['render'],
  onRef: (instance: unknown, element: HTMLElement | null) => void,
) {
  const props = { ref: null };

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
