import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Popover } from '@base-ui-components/solid/popover';
import { screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';

function Trigger(props: Popover.Trigger.Props) {
  return <Popover.Trigger {...props} ref={props.ref} render={(p) => <div {...p()} />} />;
}

describe('<Popover.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(Popover.Positioner, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Popover.Root open>
            <Popover.Portal>
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </Popover.Portal>
          </Popover.Root>
        ),
        elementProps,
      );
    },
  }));

  const baselineX = 10;
  const baselineY = 36;
  const popupWidth = 52;
  const popupHeight = 24;
  const anchorWidth = 72;
  const anchorHeight = 36;
  const triggerStyle = { width: `${anchorWidth}px`, height: `${anchorHeight}px` };
  const popupStyle = { width: `${popupWidth}px`, height: `${popupHeight}px` };

  describe.skipIf(isJSDOM)('prop: sideOffset', () => {
    it('offsets the side when a number is specified', async () => {
      const sideOffset = 7;
      render(() => (
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" sideOffset={sideOffset}>
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      expect(screen.getByTestId('positioner').style.transform).to.equal(
        `translate(${baselineX}px, ${baselineY + sideOffset}px)`,
      );
    });

    it('offsets the side when a function is specified', async () => {
      render(() => (
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              sideOffset={(data) => data.positioner.width + data.anchor.width}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      expect(screen.getByTestId('positioner').style.transform).to.equal(
        `translate(${baselineX}px, ${baselineY + popupWidth + anchorWidth}px)`,
      );
    });

    it('can read the latest side inside sideOffset', async () => {
      let side = 'none';
      render(() => (
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="left"
              data-testid="positioner"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      // correctly flips the side in the browser
      expect(side).to.equal('right');
    });

    it('can read the latest align inside sideOffset', async () => {
      let align = 'none';
      render(() => (
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="right"
              align="start"
              data-testid="positioner"
              sideOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      // correctly flips the align in the browser
      expect(align).to.equal('end');
    });

    it('reads logical side inside sideOffset', async () => {
      let side = 'none';
      render(() => (
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="inline-start"
              data-testid="positioner"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      // correctly flips the side in the browser
      expect(side).to.equal('inline-end');
    });
  });

  describe.skipIf(isJSDOM)('prop: alignOffset', () => {
    it('offsets the align when a number is specified', async () => {
      const alignOffset = 7;
      render(() => (
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" alignOffset={alignOffset}>
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      expect(screen.getByTestId('positioner').style.transform).to.equal(
        `translate(${baselineX + alignOffset}px, ${baselineY}px)`,
      );
    });

    it('offsets the align when a function is specified', async () => {
      render(() => (
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              alignOffset={(data) => data.positioner.width}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      expect(screen.getByTestId('positioner').style.transform).to.equal(
        `translate(${baselineX + popupWidth}px, ${baselineY}px)`,
      );
    });

    it('can read the latest side inside alignOffset', async () => {
      let side = 'none';
      render(() => (
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="left"
              data-testid="positioner"
              alignOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      // correctly flips the side in the browser
      expect(side).to.equal('right');
    });

    it('can read the latest align inside alignOffset', async () => {
      let align = 'none';
      render(() => (
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="right"
              align="start"
              data-testid="positioner"
              alignOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      // correctly flips the align in the browser
      expect(align).to.equal('end');
    });

    it('reads logical side inside alignOffset', async () => {
      let side = 'none';
      render(() => (
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="inline-start"
              data-testid="positioner"
              alignOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      // correctly flips the side in the browser
      expect(side).to.equal('inline-end');
    });
  });

  it.skipIf(isJSDOM)('remains anchored if keepMounted=false', async () => {
    function App(props: { top: number }) {
      return (
        <Popover.Root open>
          <Trigger
            style={{ width: '100px', height: '100px', position: 'relative', top: `${props.top}px` }}
          >
            Trigger
          </Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup style={{ width: '100px', height: '100px' }}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const [top, setTop] = createSignal(0);
    render(() => <App top={top()} />);
    const positioner = screen.getByTestId('positioner');

    const initial = 'translate(5px, 100px)';
    const final = 'translate(5px, 200px)';

    expect(positioner.style.transform).to.equal(initial);

    setTop(100);

    await waitFor(() => {
      expect(screen.getByTestId('positioner').style.transform).to.not.equal(initial);
    });

    expect(screen.getByTestId('positioner').style.transform).to.equal(final);
  });

  it.skipIf(isJSDOM)('remains anchored if keepMounted=true', async () => {
    function App(props: { top: number }) {
      return (
        <Popover.Root open>
          <Trigger
            style={{ width: '100px', height: '100px', position: 'relative', top: `${props.top}px` }}
          >
            Trigger
          </Trigger>
          <Popover.Portal keepMounted>
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup style={{ width: '100px', height: '100px' }}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const [top, setTop] = createSignal(0);
    render(() => <App top={top()} />);
    const positioner = screen.getByTestId('positioner');

    const initial = 'translate(5px, 100px)';
    const final = 'translate(5px, 200px)';

    expect(positioner.style.transform).to.equal(initial);

    setTop(100);

    await waitFor(() => {
      expect(screen.getByTestId('positioner').style.transform).to.not.equal(initial);
    });

    expect(screen.getByTestId('positioner').style.transform).to.equal(final);
  });
});
