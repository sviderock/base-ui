import { createRenderer } from '#test-utils';
import { expect } from 'chai';
import { NoSsr } from '.';

// TODO: fix ssr tests
describe('<NoSsr />', () => {
  const { render } = createRenderer();

  describe('server-side rendering', () => {
    // TODO: fix ssr tests
    it.skip('should not render the children as the width is unknown', async () => {
      const { container } = render(() => (
        <NoSsr>
          <span>Hello</span>
        </NoSsr>
      ));

      expect(container.firstChild).to.equal(null);
    });
  });

  describe('mounted', () => {
    it('should render the children', () => {
      render(() => (
        <NoSsr>
          <span id="client-only" />
        </NoSsr>
      ));
      expect(document.querySelector('#client-only')).not.to.equal(null);
    });
  });

  // TODO: defer is not needed for Solid?
  // describe('prop: fallback', () => {
  //   it.skip('should render the fallback', () => {
  //     const { container } = render(() => (
  //       <div>
  //         <NoSsr fallback="fallback">
  //           <span>Hello</span>
  //         </NoSsr>
  //       </div>
  //     ));

  //     expect(container.firstChild).to.have.text('fallback');
  //   });
  // });

  // describe('prop: defer', () => {
  //   it('should defer the rendering', async () => {
  //     render(() => (
  //       <NoSsr defer>
  //         <span id="client-only">Hello</span>
  //       </NoSsr>
  //     ));
  //     screen.debug();
  //     await flushMicrotasks();
  //     expect(document.querySelector('#client-only')).not.to.equal(null);
  //   });
  // });
});
