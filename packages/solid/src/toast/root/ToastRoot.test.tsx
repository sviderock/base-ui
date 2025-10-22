import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Toast } from '@base-ui-components/solid/toast';
import { fireEvent, screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { For } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Button, List } from '../utils/test-utils';

const toast: Toast.Root.ToastObject = {
  id: 'test',
  title: 'Toast title',
};

describe('<Toast.Root />', () => {
  const { render } = createRenderer();

  describeConformance(
    (props: any) => <Toast.Root {...props} ref={props.ref} toast={toast} />,
    () => ({
      refInstanceof: window.HTMLDivElement,
      render(node, elementProps = {}) {
        return render(
          () => (
            <Toast.Provider>
              <Toast.Viewport>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </Toast.Viewport>
            </Toast.Provider>
          ),
          elementProps,
        );
      },
    }),
  );

  // requires :focus-visible check
  it.skipIf(isJSDOM)('closes when pressing escape', async () => {
    const { user } = render(() => (
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>
    ));

    const button = screen.getByRole('button', { name: 'add' });

    button.focus();
    await user.click(button);

    await user.keyboard('{F6}');
    await user.keyboard('{Tab}');
    await user.keyboard('{Escape}');

    expect(screen.queryByTestId('root')).to.equal(null);
  });

  it('renders title and description inside role=status node one tick later', async () => {
    function AccessibilityTestButton() {
      const { add } = Toast.useToastManager();
      return (
        <button
          type="button"
          onClick={() => {
            add({
              title: 'title',
              description: 'description',
            });
          }}
        >
          add
        </button>
      );
    }

    function AccessibilityTestList() {
      return (
        <For each={Toast.useToastManager().toasts()}>
          {(toastItem) => (
            <Toast.Root toast={toastItem} data-testid="root">
              <Toast.Title>{toastItem.title}</Toast.Title>
              <Toast.Description data-testid="description">
                {toastItem.description}
              </Toast.Description>
              <Toast.Close aria-label="close" />
            </Toast.Root>
          )}
        </For>
      );
    }

    render(() => (
      <Toast.Provider>
        <Toast.Viewport>
          <AccessibilityTestList />
        </Toast.Viewport>
        <AccessibilityTestButton />
      </Toast.Provider>
    ));

    fireEvent.click(screen.getByRole('button', { name: 'add' }));

    const status = screen.getByRole('status');
    expect(status).not.to.have.text('titledescription');

    await waitFor(() => {
      expect(status).to.have.text('titledescription');
    });
  });

  describe.skipIf(isJSDOM)('swipe behavior', () => {
    function SwipeTestButton() {
      const { add } = Toast.useToastManager();
      return (
        <button
          type="button"
          onClick={() => {
            add({
              id: 'swipe-test-toast',
              title: 'Swipe Me',
              description: 'Swipe to dismiss',
            });
          }}
        >
          add toast
        </button>
      );
    }

    function SwipeTestToast(props: { swipeDirection: Toast.Root.Props['swipeDirection'] }) {
      return (
        <For each={Toast.useToastManager().toasts()}>
          {(toastItem) => (
            <Toast.Root
              toast={toastItem}
              data-testid="toast-root"
              swipeDirection={props.swipeDirection}
            >
              <Toast.Title>{toastItem.title}</Toast.Title>
              <Toast.Description>{toastItem.description}</Toast.Description>
            </Toast.Root>
          )}
        </For>
      );
    }

    function simulateSwipe(
      element: HTMLElement,
      startX: number,
      startY: number,
      endX: number,
      endY: number,
    ) {
      fireEvent.pointerDown(element, {
        clientX: startX,
        clientY: startY,
        button: 0,
        bubbles: true,
        pointerId: 1,
      });
      // Fire an initial move event close to the start to trigger the isFirstPointerMoveRef logic correctly.
      // This simulates the finger moving slightly before the main swipe movement is registered.
      let deltaX = 0;
      if (endX > startX) {
        deltaX = 1;
      } else if (endX < startX) {
        deltaX = -1;
      }

      let deltaY = 0;
      if (endY > startY) {
        deltaY = 1;
      } else if (endY < startY) {
        deltaY = -1;
      }

      fireEvent.pointerMove(element, {
        clientX: startX + deltaX,
        clientY: startY + deltaY,
        bubbles: true,
        pointerId: 1,
      });
      // Fire the main move event to the end position.
      fireEvent.pointerMove(element, {
        clientX: endX,
        clientY: endY,
        bubbles: true,
        pointerId: 1,
      });
      fireEvent.pointerUp(element, { clientX: endX, clientY: endY, bubbles: true, pointerId: 1 });
    }

    it('closes toast when swiping in the specified direction beyond threshold', async () => {
      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>
      ));

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Swipe up (starting at y=100, ending at y=55, which is > 40px threshold)
      simulateSwipe(toastElement, 100, 100, 100, 55);

      await waitFor(() => {
        expect(screen.queryByTestId('toast-root')).to.equal(null);
      });
    });

    it('does not close toast when swiping in the specified direction below threshold', async () => {
      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>
      ));

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Swipe up but only by 10px (below 40px threshold)
      simulateSwipe(toastElement, 100, 100, 100, 90);

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);
    });

    it('does not close toast when swiping in a non-specified direction', async () => {
      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>
      ));

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Swipe down (opposite of allowed direction)
      simulateSwipe(toastElement, 100, 100, 100, 150);

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);
    });

    it('supports multiple swipe directions', async () => {
      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection={['up', 'right']} />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>
      ));

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Swipe right
      simulateSwipe(toastElement, 100, 100, 150, 100);

      await waitFor(() => {
        expect(screen.queryByTestId('toast-root')).to.equal(null);
      });
    });

    it('cancels swipe when direction is reversed beyond threshold', async () => {
      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>
      ));

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Start swiping up
      fireEvent.pointerDown(toastElement, { clientX: 100, clientY: 100, button: 0, pointerId: 1 });
      fireEvent.pointerMove(toastElement, { clientX: 100, clientY: 80, pointerId: 1 });

      // Then reverse direction
      fireEvent.pointerMove(toastElement, { clientX: 100, clientY: 90, pointerId: 1 });
      fireEvent.pointerUp(toastElement, { clientX: 100, clientY: 90, pointerId: 1 });

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);
    });

    it('applies [data-swiping] attribute when swiping', async () => {
      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>
      ));

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      fireEvent.pointerDown(toastElement, { clientX: 100, clientY: 100, button: 0, pointerId: 1 });

      expect(toastElement.getAttribute('data-swiping')).to.equal('');
    });

    it('dismisses toast when swiped down with downward swipe direction', async () => {
      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="down" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>
      ));

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');
      simulateSwipe(toastElement, 100, 100, 100, 150);

      expect(screen.queryByTestId('toast-root')).to.equal(null);
    });

    it('dismisses toast when swiped left with leftward swipe direction', async () => {
      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="left" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>
      ));

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');
      simulateSwipe(toastElement, 100, 100, 50, 100);

      expect(screen.queryByTestId('toast-root')).to.equal(null);
    });

    it('dismisses toast when swiped right with rightward swipe direction', async () => {
      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="right" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>
      ));

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');
      simulateSwipe(toastElement, 100, 100, 150, 100);

      expect(screen.queryByTestId('toast-root')).to.equal(null);
    });

    it('allows swiping in multiple directions when specified', async () => {
      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection={['up', 'right']} />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>
      ));

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // First test upward swipe
      simulateSwipe(toastElement, 100, 100, 100, 50);

      expect(screen.queryByTestId('toast-root')).to.equal(null);

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));
      const secondToastElement = screen.getByTestId('toast-root');

      simulateSwipe(secondToastElement, 100, 100, 150, 100);

      expect(screen.queryByTestId('toast-root')).to.equal(null);
    });

    it('does not dismiss when swiped in non-specified direction', async () => {
      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>
      ));

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Swipe right (not allowed)
      simulateSwipe(toastElement, 100, 100, 150, 100);

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);

      // Swipe down (not allowed)
      simulateSwipe(toastElement, 100, 100, 100, 150);

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);
    });

    it('does not dismiss when swipe distance is below threshold', async () => {
      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>
      ));

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Small upward swipe (below threshold)
      simulateSwipe(toastElement, 100, 100, 100, 95);

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);
    });
  });
});
