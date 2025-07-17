import { flushMicrotasks, randomStringValue } from '@mui/internal-test-utils';
import { expect } from 'chai';
import type { Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type {
  BaseUiConformanceTestsOptions,
  ConformantComponentProps,
} from '../describeConformance';
import { throwMissingPropError } from './utils';

export function testPropForwarding(
  element: Component<ConformantComponentProps>,
  getOptions: () => BaseUiConformanceTestsOptions,
) {
  const { render, testRenderPropWith: Element = 'div' } = getOptions();

  if (!render) {
    throwMissingPropError('render');
  }

  describe('prop forwarding', () => {
    it('forwards custom props to the default element', async () => {
      const otherProps = {
        lang: 'fr',
        'data-foobar': randomStringValue(),
      };

      const { getByTestId } = await render(() => (
        <Dynamic component={element} data-testid="root" {...otherProps} />
      ));

      await flushMicrotasks();

      const customRoot = getByTestId('root');
      expect(customRoot).to.have.attribute('lang', otherProps.lang);
      expect(customRoot).to.have.attribute('data-foobar', otherProps['data-foobar']);
    });

    it('forwards custom props to the customized element defined with a function', async () => {
      const otherProps = {
        lang: 'fr',
        'data-foobar': randomStringValue(),
      };

      const { getByTestId } = await render(() => (
        <Dynamic
          component={element}
          render={(props) => <Element {...props} data-testid="custom-root" />}
          {...otherProps}
        />
      ));

      await flushMicrotasks();

      const customRoot = getByTestId('custom-root');
      expect(customRoot).to.have.attribute('lang', otherProps.lang);
      expect(customRoot).to.have.attribute('data-foobar', otherProps['data-foobar']);
    });

    it('forwards custom props to the customized element defined using JSX', async () => {
      const otherProps = {
        lang: 'fr',
        'data-foobar': randomStringValue(),
      };

      const { getByTestId } = await render(() => (
        <Dynamic
          component={element}
          render={<Element data-testid="custom-root" />}
          {...otherProps}
        />
      ));

      await flushMicrotasks();

      const customRoot = getByTestId('custom-root');
      expect(customRoot).to.have.attribute('lang', otherProps.lang);
      expect(customRoot).to.have.attribute('data-foobar', otherProps['data-foobar']);
    });

    it('forwards the custom `style` attribute defined on the component', async () => {
      const { getByTestId } = await render(() => (
        <Dynamic component={element} style={{ color: 'green' }} data-testid="custom-root" />
      ));

      await flushMicrotasks();

      const customRoot = getByTestId('custom-root');
      expect(customRoot).to.have.attribute('style');
      expect(customRoot.getAttribute('style')).to.contain('color: green');
    });

    it('forwards the custom `style` attribute defined on the render function', async () => {
      const { getByTestId } = await render(() => (
        <Dynamic
          component={element}
          render={(props) => (
            <Element {...props} style={{ color: 'green' }} data-testid="custom-root" />
          )}
        />
      ));

      await flushMicrotasks();

      const customRoot = getByTestId('custom-root');
      expect(customRoot).to.have.attribute('style');
      expect(customRoot.getAttribute('style')).to.contain('color: green');
    });

    it('forwards the custom `style` attribute defined on the render function', async () => {
      const { getByTestId } = await render(() => (
        <Dynamic
          component={element}
          render={<Element style={{ color: 'green' }} data-testid="custom-root" />}
        />
      ));

      await flushMicrotasks();

      const customRoot = getByTestId('custom-root');
      expect(customRoot).to.have.attribute('style');
      expect(customRoot.getAttribute('style')).to.contain('color: green');
    });
  });
}
