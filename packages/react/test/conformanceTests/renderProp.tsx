import { randomStringValue } from '@mui/internal-test-utils';
import { screen } from '@testing-library/react';
import { expect } from 'chai';
import * as React from 'react';
import type {
  BaseUiConformanceTestsOptions,
  ConformantComponentProps,
} from '../describeConformance';
import { throwMissingPropError } from './utils';

export function testRenderProp(
  element: React.ReactElement<ConformantComponentProps>,
  getOptions: () => BaseUiConformanceTestsOptions,
) {
  const { render, testRenderPropWith: Element = 'div' } = getOptions();

  if (!render) {
    throwMissingPropError('render');
  }

  const Wrapper = React.forwardRef<any, { children?: React.ReactNode }>(
    function Wrapper(props, forwardedRef) {
      return (
        <div data-testid="base-ui-wrapper">
          {/* @ts-ignore */}
          <Element ref={forwardedRef} {...props} data-testid="wrapped" />
        </div>
      );
    },
  );

  describe('prop: render', () => {
    it('renders a customized root element with a function', async () => {
      const testValue = randomStringValue();
      const { queryByTestId } = await render(
        React.cloneElement(element, {
          render: (props: {}) => <Wrapper {...props} data-test-value={testValue} />,
        }),
      );

      expect(queryByTestId('base-ui-wrapper')).not.to.equal(null);
      expect(queryByTestId('wrapped')).not.to.equal(null);
      expect(queryByTestId('wrapped')).to.have.attribute('data-test-value', testValue);
    });

    it('renders a customized root element with an element', async () => {
      const testValue = randomStringValue();
      const { queryByTestId } = await render(
        React.cloneElement(element, {
          render: <Wrapper data-test-value={testValue} />,
        }),
      );

      expect(queryByTestId('base-ui-wrapper')).not.to.equal(null);
      expect(queryByTestId('wrapped')).not.to.equal(null);
      expect(queryByTestId('wrapped')).to.have.attribute('data-test-value', testValue);
    });

    it('renders a customized root element with an element', async () => {
      await render(
        React.cloneElement(element, {
          render: <Wrapper />,
        }),
      );

      expect(document.querySelector('[data-testid="base-ui-wrapper"]')).not.to.equal(null);
    });

    it('should pass the ref to the custom component', async () => {
      let instanceFromRef = null;

      function Test() {
        return React.cloneElement(element, {
          ref: (el: HTMLElement | null) => {
            instanceFromRef = el;
          },
          render: (props: {}) => <Wrapper {...props} />,
          'data-testid': 'wrapped',
        });
      }

      await render(<Test />);
      screen.debug();
      expect(instanceFromRef!.tagName).to.equal(Element.toUpperCase());
      expect(instanceFromRef!).to.have.attribute('data-testid', 'wrapped');
    });

    it('should merge the rendering element ref with the custom component ref', async () => {
      let refA = null;
      let refB = null;

      function Test() {
        return React.cloneElement(element, {
          ref: (el: HTMLElement | null) => {
            refA = el;
          },
          render: (
            <Wrapper
              ref={(el: HTMLElement | null) => {
                refB = el;
              }}
            />
          ),
          'data-testid': 'wrapped',
        });
      }

      await render(<Test />);

      expect(refA).not.to.equal(null);
      expect(refA!.tagName).to.equal(Element.toUpperCase());
      expect(refA!).to.have.attribute('data-testid', 'wrapped');
      expect(refB).not.to.equal(null);
      expect(refB!.tagName).to.equal(Element.toUpperCase());
      expect(refB!).to.have.attribute('data-testid', 'wrapped');
    });

    it('should merge the rendering element className with the custom component className', async () => {
      function Test() {
        return React.cloneElement(element, {
          className: 'component-classname',
          render: <Element className="render-prop-classname" />,
          'data-testid': 'test-component',
        });
      }

      const { getByTestId } = await render(<Test />);

      const component = getByTestId('test-component');
      expect(component.classList.contains('component-classname')).to.equal(true);
      expect(component.classList.contains('render-prop-classname')).to.equal(true);
    });

    it('should merge the rendering element resolved className with the custom component className', async () => {
      function Test() {
        return React.cloneElement(element, {
          className: () => 'conditional-component-classname',
          render: <Element className="render-prop-classname" />,
          'data-testid': 'test-component',
        });
      }

      const { getByTestId } = await render(<Test />);

      const component = getByTestId('test-component');
      expect(component.classList.contains('conditional-component-classname')).to.equal(true);
      expect(component.classList.contains('render-prop-classname')).to.equal(true);
    });
  });
}
