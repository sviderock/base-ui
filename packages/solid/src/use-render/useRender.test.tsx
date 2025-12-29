/* eslint-disable testing-library/render-result-naming-convention */
import { createRenderer } from '#test-utils';
import { expect } from 'chai';
import { splitProps, type ComponentProps } from 'solid-js';
import { useRender } from './useRender';

describe('useRender', () => {
  const { render } = createRenderer();

  it('render props does not overwrite class in a render function when unspecified', async () => {
    function TestComponent(props: {
      render: useRender.Parameters<{}, Element, undefined>['render'];
      class?: string;
    }) {
      const element = useRender(props);
      return <>{element()}</>;
    }

    const { container } = render(() => (
      <TestComponent
        render={(props: any, state: any) => (
          <span {...props} class={`my-span ${props.class ?? ''}`} {...state} />
        )}
      />
    ));

    const element = container.firstElementChild;

    expect(element).to.have.attribute('class', 'my-span ');
  });

  it('refs are handled as expected', async () => {
    const refs: (HTMLElement | undefined)[] = [];

    function TestComponent(
      props: {
        render: useRender.Parameters<{}, Element, undefined>['render'];
        class?: string;
      } & ComponentProps<'span'>,
    ) {
      const [local, otherProps] = splitProps(props, ['render']);

      const element = useRender({
        // eslint-disable-next-line solid/reactivity
        render: local.render,
        ref: (el: HTMLElement) => {
          refs[0] = el;
          refs[1] = el;
        },
        props: otherProps,
      });
      return <>{element()}</>;
    }

    const { container } = render(() => (
      <TestComponent render={(props: any, state: any) => <span {...props} {...state} />} />
    ));
    expect(refs.length).to.equal(2);

    refs.forEach((ref) => {
      expect(ref).to.deep.equal(container.firstElementChild);
    });
  });
});
