import { randomStringValue } from '@mui/internal-test-utils';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import type { Component, ParentComponent } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type {
  BaseUiConformanceTestsOptions,
  ConformantComponentProps,
} from '../describeConformance';
import { throwMissingPropError } from './utils';

export function testRenderProp(
  element: Component<ConformantComponentProps>,
  getOptions: () => BaseUiConformanceTestsOptions,
) {
  const { render, testRenderPropWith: Element = 'div' } = getOptions();

  if (!render) {
    throwMissingPropError('render');
  }

  const Wrapper: ParentComponent = (props) => {
    return (
      <div data-testid="base-ui-wrapper">
        <Dynamic component={Element} {...props} data-testid="wrapped" />
      </div>
    );
  };

  describe('prop: render', () => {
    it('renders a customized root element with a function', () => {
      const testValue = randomStringValue();
      render(element, {
        render: (props) => <Wrapper {...props} data-test-value={testValue} />,
      });

      expect(screen.queryByTestId('base-ui-wrapper')).not.to.equal(null);
      expect(screen.queryByTestId('wrapped')).not.to.equal(null);
      expect(screen.queryByTestId('wrapped')).to.have.attribute('data-test-value', testValue);
    });

    /**
     * TODO JSX SUPPORT: figure out if this would need to be supported
     * This is skipped as when the element is a JSX element – Solid has already resolved the element
     */
    it.skip('renders a customized root element with an element', () => {
      const testValue = randomStringValue();
      render(element, {
        // @ts-expect-error
        render: <Wrapper data-test-value={testValue} />,
      });

      expect(screen.queryByTestId('base-ui-wrapper')).not.to.equal(null);
      expect(screen.queryByTestId('wrapped')).not.to.equal(null);
      expect(screen.queryByTestId('wrapped')).to.have.attribute('data-test-value', testValue);
    });

    /**
     * TODO JSX SUPPORT: figure out if this would need to be supported
     * This is skipped as when the element is a JSX element – Solid has already resolved the element
     */
    it.skip('renders a customized root element with an element', () => {
      render(element, {
        // @ts-expect-error
        render: <Wrapper />,
      });

      expect(document.querySelector('[data-testid="base-ui-wrapper"]')).not.to.equal(null);
    });

    it('should pass the ref to the custom component', () => {
      let instanceFromRef;

      function Test() {
        return (
          <Dynamic
            component={element}
            ref={instanceFromRef}
            render={(props) => <Wrapper {...props} />}
            data-testid="wrapped"
          />
        );
      }

      render(Test);
      expect(instanceFromRef!.tagName).to.equal(Element.toUpperCase());
      expect(instanceFromRef!).to.have.attribute('data-testid', 'wrapped');
    });

    /**
     * TODO JSX SUPPORT: figure out if this would need to be supported
     * This is skipped as when the element is a JSX element – Solid has already resolved the element
     */
    it.skip('should merge the rendering element ref with the custom component ref', () => {
      let refA = null as HTMLElement | null;
      let refB = null as HTMLElement | null;

      function Test() {
        return (
          <Dynamic
            component={element}
            ref={(el: HTMLElement | null) => {
              refA = el;
            }}
            // @ts-expect-error
            render={
              <Wrapper
                ref={(el: HTMLElement | null) => {
                  refB = el;
                }}
              />
            }
            data-testid="wrapped"
          />
        );
      }

      render(Test);

      expect(refA).not.to.equal(null);
      expect(refA!.tagName).to.equal(Element.toUpperCase());
      expect(refA!).to.have.attribute('data-testid', 'wrapped');
      expect(refB).not.to.equal(null);
      expect(refB!.tagName).to.equal(Element.toUpperCase());
      expect(refB!).to.have.attribute('data-testid', 'wrapped');
    });

    it.skip('should merge the rendering element className with the custom component className', () => {
      function Test() {
        return (
          <Dynamic
            component={element}
            class="component-classname"
            // @ts-expect-error
            render={<Element class="render-prop-classname" />}
            data-testid="test-component"
          />
        );
      }

      render(Test);

      const component = screen.getByTestId('test-component');
      expect(component.classList.contains('component-classname')).to.equal(true);
      expect(component.classList.contains('render-prop-classname')).to.equal(true);
    });

    /**
     * TODO JSX SUPPORT: figure out if this would need to be supported
     * This is skipped as when the element is a JSX element – Solid has already resolved the element
     */
    it.skip('should merge the rendering element resolved className with the custom component className', () => {
      function Test() {
        return (
          <Dynamic
            component={element}
            class={() => 'conditional-component-classname'}
            // @ts-expect-error
            render={<Element class="render-prop-classname" />}
            data-testid="test-component"
          />
        );
      }

      render(Test);

      const component = screen.getByTestId('test-component');
      expect(component.classList.contains('conditional-component-classname')).to.equal(true);
      expect(component.classList.contains('render-prop-classname')).to.equal(true);
    });
  });
}
