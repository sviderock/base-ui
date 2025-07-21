import { randomStringValue } from '@mui/internal-test-utils';
import { expect } from 'chai';
import type { Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type {
  BaseUiConformanceTestsOptions,
  ConformantComponentProps,
} from '../describeConformance';
import { throwMissingPropError } from './utils';

export function testPropForwarding<T>(
  element: Component<ConformantComponentProps<T>>,
  getOptions: () => BaseUiConformanceTestsOptions<T>,
) {
  const { render, testRenderPropWith: Element = 'div' } = getOptions();

  if (!render) {
    throwMissingPropError('render');
  }

  describe('prop forwarding', () => {
    it('forwards custom props to the default element', () => {
      const otherProps = {
        lang: 'fr',
        'data-foobar': randomStringValue(),
      };

      const { getByTestId } = render(element, { 'data-testid': 'root', ...otherProps });

      const customRoot = getByTestId('root');
      expect(customRoot).to.have.attribute('lang', otherProps.lang);
      expect(customRoot).to.have.attribute('data-foobar', otherProps['data-foobar']);
    });

    it('forwards custom props to the customized element defined with a function', () => {
      const otherProps = {
        lang: 'fr',
        'data-foobar': randomStringValue(),
      };

      const { getByTestId } = render(element, {
        render: (props) => <Dynamic component={Element} {...props} data-testid="custom-root" />,
        ...otherProps,
      });

      const customRoot = getByTestId('custom-root');
      expect(customRoot).to.have.attribute('lang', otherProps.lang);
      expect(customRoot).to.have.attribute('data-foobar', otherProps['data-foobar']);
    });

    /**
     * TODO: figure out if this would need to be supported
     * This is skipped as when the element is a JSX element – Solid has already resolved the element
     */
    it.skip('forwards custom props to the customized element defined using JSX', () => {
      const otherProps = {
        lang: 'fr',
        'data-foobar': randomStringValue(),
      };

      const { getByTestId } = render(element, {
        // @ts-expect-error
        render: <Dynamic component={Element} data-testid="custom-root" />,
        ...otherProps,
      });

      const customRoot = getByTestId('custom-root');
      expect(customRoot).to.have.attribute('lang', otherProps.lang);
      expect(customRoot).to.have.attribute('data-foobar', otherProps['data-foobar']);
    });

    it('forwards the custom `style` attribute defined on the component', () => {
      const { getByTestId } = render(element, {
        style: { color: 'green' },
        'data-testid': 'custom-root',
      });

      const customRoot = getByTestId('custom-root');
      expect(customRoot).to.have.attribute('style');
      expect(customRoot.getAttribute('style')).to.contain('color: green');
    });

    it('forwards the custom `style` attribute defined on the render function', () => {
      const { getByTestId } = render(element, {
        render: (props) => (
          <Dynamic
            component={Element}
            {...props}
            style={{ color: 'green' }}
            data-testid="custom-root"
          />
        ),
      });

      const customRoot = getByTestId('custom-root');
      expect(customRoot).to.have.attribute('style');
      expect(customRoot.getAttribute('style')).to.contain('color: green');
    });

    /**
     * TODO: figure out if this would need to be supported
     * This is skipped as when the element is a JSX element – Solid has already resolved the element
     */
    it.skip('forwards the custom `style` attribute defined on the render function', () => {
      const { getByTestId } = render(element, {
        // @ts-expect-error
        render: <Element style={{ color: 'green' }} data-testid="custom-root" />,
      });

      const customRoot = getByTestId('custom-root');
      expect(customRoot).to.have.attribute('style');
      expect(customRoot.getAttribute('style')).to.contain('color: green');
    });
  });
}
