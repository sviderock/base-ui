import { createRenderer, describeConformance } from '#test-utils';
import { ScrollArea } from '@base-ui-components/solid/scroll-area';
import { fireEvent, screen } from '@solidjs/testing-library';
import { SCROLL_TIMEOUT } from '../constants';

describe('<ScrollArea.Scrollbar />', () => {
  const { render, clock } = createRenderer();

  clock.withFakeTimers();

  describeConformance(
    (props) => <ScrollArea.Scrollbar keepMounted {...props} ref={props.ref} />,
    () => ({
      refInstanceof: window.HTMLDivElement,
      render(node, props) {
        return render(() => <ScrollArea.Root>{node(props)}</ScrollArea.Root>);
      },
    }),
  );

  it('adds [data-scrolling] attribute when viewport is scrolled in the correct direction', async () => {
    render(() => (
      <ScrollArea.Root style={{ width: '200px', height: '200px' }}>
        <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
          <div style={{ width: '1000px', height: '1000px' }} />
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical" keepMounted />
        <ScrollArea.Scrollbar orientation="horizontal" data-testid="horizontal" keepMounted />
        <ScrollArea.Corner />
      </ScrollArea.Root>
    ));

    const verticalScrollbar = screen.getByTestId('vertical');
    const horizontalScrollbar = screen.getByTestId('horizontal');
    const viewport = screen.getByTestId('viewport');

    expect(verticalScrollbar).not.toHaveAttribute('data-scrolling');
    expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling');

    fireEvent.pointerEnter(viewport);
    fireEvent.scroll(viewport, {
      target: {
        scrollTop: 1,
      },
    });

    expect(verticalScrollbar).toHaveAttribute('data-scrolling', '');
    expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling', '');

    clock.tick(SCROLL_TIMEOUT - 1);

    expect(verticalScrollbar).toHaveAttribute('data-scrolling', '');
    expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling', '');

    fireEvent.pointerEnter(viewport);
    fireEvent.scroll(viewport, {
      target: {
        scrollLeft: 1,
      },
    });

    clock.tick(1); // vertical just finished

    expect(verticalScrollbar).not.toHaveAttribute('data-scrolling');
    expect(horizontalScrollbar).toHaveAttribute('data-scrolling');

    clock.tick(SCROLL_TIMEOUT - 2); // already ticked 1ms above

    expect(verticalScrollbar).not.toHaveAttribute('data-scrolling');
    expect(horizontalScrollbar).toHaveAttribute('data-scrolling');

    clock.tick(1);

    expect(verticalScrollbar).not.toHaveAttribute('data-scrolling');
    expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling');
  });
});
