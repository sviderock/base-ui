import { createRenderer } from '#test-utils';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createSignal, onCleanup, splitProps, type Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { type ReactLikeRef } from '../solid-helpers';
import { useForkRef } from './useForkRef';

describe('useForkRef', () => {
  const { render } = createRenderer();

  it('returns a single ref-setter function that forks the ref to its inputs', () => {
    interface TestComponentProps {
      innerRef: ReactLikeRef<HTMLDivElement>;
    }

    function Component(props: TestComponentProps) {
      const [ownRefCurrent, ownRef] = createSignal<HTMLDivElement | null>(null);

      return (
        <div ref={useForkRef(props.innerRef, ownRef)}>
          {ownRefCurrent() ? 'has a ref' : 'has no ref'}
        </div>
      );
    }

    let outerRef: ReactLikeRef<HTMLDivElement> = { current: null };

    expect(() => {
      render(() => <Component innerRef={outerRef} />);
    }).not.toErrorDev();
    expect(outerRef.current!.textContent).to.equal('has a ref');
  });

  it('forks if only one of the branches requires a ref', () => {
    function Component(props: any) {
      const [hasRef, setHasRef] = createSignal(false);
      const handleOwnRef = () => setHasRef(true);

      return (
        <div ref={useForkRef(handleOwnRef, props.ref)} data-testid="hasRef">
          {String(hasRef())}
        </div>
      );
    }

    expect(() => {
      render(() => <Component />);
    }).not.toErrorDev();

    expect(screen.getByTestId('hasRef')).to.have.text('true');
  });

  it('does nothing if none of the forked branches requires a ref', () => {
    interface TestComponentProps {
      children: Component;
    }

    function Outer(props: TestComponentProps) {
      return <Dynamic component={props.children} ref={useForkRef(null, (props as any).ref)} />;
    }

    function Inner() {
      return <div />;
    }

    expect(() => {
      render(() => <Outer>{() => <Inner />}</Outer>);
    }).not.toErrorDev();
  });

  describe('changing refs', () => {
    interface TestComponentProps {
      leftRef?: ReactLikeRef<HTMLDivElement>;
      rightRef?: ReactLikeRef<HTMLDivElement>;
      id?: string;
    }

    function Div(props: TestComponentProps) {
      const [local, other] = splitProps(props, ['leftRef', 'rightRef']);

      return <div {...other} ref={useForkRef(local.leftRef, local.rightRef)} />;
    }

    it('handles changing from no ref to some ref', () => {
      const leftRef: ReactLikeRef<HTMLDivElement> = { current: null };

      expect(() => {
        render(() => <Div id="test" leftRef={leftRef} />);
      }).not.toErrorDev();

      const ref: ReactLikeRef<HTMLDivElement> = { current: null };
      expect(() => {
        ref.current = leftRef.current;
      }).not.toErrorDev();
      expect(ref.current!.id).to.equal('test');
    });

    // TODO: not sure if this is needed is Solid
    it.skip('cleans up detached refs', () => {
      const firstLeftRef: ReactLikeRef<HTMLDivElement> = { current: null };
      const firstRightRef: ReactLikeRef<HTMLDivElement> = { current: null };
      const secondRightRef: ReactLikeRef<HTMLDivElement> = { current: null };
      const [ref, setRef] = createSignal<ReactLikeRef<HTMLDivElement>>(firstRightRef);

      expect(() => {
        render(() => <Div leftRef={firstLeftRef} rightRef={ref()} id="test" />);
      }).not.toErrorDev();

      expect(firstLeftRef.current!.id).to.equal('test');
      expect(firstRightRef.current!.id).to.equal('test');
      expect(secondRightRef.current).to.equal(null);

      setRef(secondRightRef);

      expect(firstLeftRef.current!.id).to.equal('test');
      expect(firstRightRef.current).to.equal(null);
      expect(secondRightRef.current!.id).to.equal('test');
    });
  });

  test('calls clean up function if it exists', () => {
    const cleanUp = spy();
    const setup = spy();
    const setup2 = spy();
    const nullHandler = spy();

    function onRefChangeWithCleanup(ref: HTMLDivElement | null) {
      if (ref) {
        setup(ref.id);
      } else {
        nullHandler();
      }
      onCleanup(cleanUp);
    }

    function onRefChangeWithoutCleanup(ref: HTMLDivElement | null) {
      if (ref) {
        setup2(ref.id);
      } else {
        nullHandler();
      }
    }

    function App() {
      return <div id="test" ref={useForkRef(onRefChangeWithCleanup, onRefChangeWithoutCleanup)} />;
    }

    const { unmount } = render(() => <App />);

    expect(setup.args[0][0]).to.equal('test');
    expect(setup.callCount).to.equal(1);
    expect(cleanUp.callCount).to.equal(0);

    expect(setup2.args[0][0]).to.equal('test');
    expect(setup2.callCount).to.equal(1);

    unmount();

    expect(setup.callCount).to.equal(1);
    expect(cleanUp.callCount).to.equal(1);

    // Setup was not called again
    expect(setup2.callCount).to.equal(1);
    // Null handler hit because no cleanup is returned
    // TODO: null handler will not be called as refs cannot be dynamically changed
    expect(nullHandler.callCount).to.equal(0);
  });
});
