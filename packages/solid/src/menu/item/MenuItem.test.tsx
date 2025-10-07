import { createRenderer, describeConformance, flushMicrotasks, isJSDOM } from '#test-utils';
import { Menu } from '@base-ui-components/solid/menu';
import { A, createMemoryHistory, MemoryRouter, Route, Router, useLocation } from '@solidjs/router';
import { fireEvent, screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { spy } from 'sinon';
import { type JSX, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';

describe('<Menu.Item />', () => {
  const { render, clock } = createRenderer({
    clockOptions: {
      shouldAdvanceTime: true,
    },
  });

  clock.withFakeTimers();

  describeConformance(Menu.Item, () => ({
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <Menu.Root open>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Menu.Root>
        ),
        elementProps,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  it('calls the onClick handler when clicked', async () => {
    const onClick = spy();
    const { user } = render(() => (
      <Menu.Root open>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item onClick={onClick} id="item">
                Item
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ));

    const item = screen.getByRole('menuitem');
    await user.click(item);

    expect(onClick.callCount).to.equal(1);
  });

  it('perf: does not rerender menu items unnecessarily', async ({ skip }) => {
    if (isJSDOM) {
      skip();
    }

    const renderItem1Spy = spy();
    const renderItem2Spy = spy();
    const renderItem3Spy = spy();
    const renderItem4Spy = spy();

    function LoggingRoot(props: any & { renderSpy: () => void }) {
      const [local, other] = splitProps(props, ['renderSpy', 'state']);
      local.renderSpy();
      return <li {...other} ref={props.ref} />;
    }

    const { getAllByRole, user } = render(() => (
      <Menu.Root open>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item
                render={(props) => <LoggingRoot {...props()} renderSpy={renderItem1Spy} />}
                id="item-1"
              >
                1
              </Menu.Item>
              <Menu.Item
                render={(props) => <LoggingRoot {...props()} renderSpy={renderItem2Spy} />}
                id="item-2"
              >
                2
              </Menu.Item>
              <Menu.Item
                render={(props) => <LoggingRoot {...props()} renderSpy={renderItem3Spy} />}
                id="item-3"
              >
                3
              </Menu.Item>
              <Menu.Item
                render={(props) => <LoggingRoot {...props()} renderSpy={renderItem4Spy} />}
                id="item-4"
              >
                4
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ));

    const menuItems = getAllByRole('menuitem');
    menuItems[0].focus();

    renderItem1Spy.resetHistory();
    renderItem2Spy.resetHistory();
    renderItem3Spy.resetHistory();
    renderItem4Spy.resetHistory();

    expect(renderItem1Spy.callCount).to.equal(0);

    await user.keyboard('{ArrowDown}'); // highlights '2'

    // React renders twice in strict mode, so we expect twice the number of spy calls

    await waitFor(
      () => {
        expect(renderItem1Spy.callCount).to.equal(2); // '1' rerenders as it loses highlight
      },
      { timeout: 1000 },
    );
    await waitFor(
      () => {
        expect(renderItem2Spy.callCount).to.equal(2); // '2' rerenders as it receives highlight
      },
      { timeout: 1000 },
    );

    // neither the highlighted nor the selected state of these options changed,
    // so they don't need to rerender:
    expect(renderItem3Spy.callCount).to.equal(0);
    expect(renderItem4Spy.callCount).to.equal(0);
  });

  describe('prop: closeOnClick', () => {
    it('closes the menu when the item is clicked by default', async () => {
      const { user } = render(() => (
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>Item</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      ));

      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = screen.getByRole('menuitem');
      await user.click(item);

      expect(screen.queryByRole('menu')).to.equal(null);
    });

    it('when `closeOnClick=false` does not close the menu when the item is clicked', async () => {
      const { getByRole, user } = render(() => (
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item closeOnClick={false}>Item</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      ));

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = screen.getByRole('menuitem');
      await user.click(item);

      expect(screen.queryByRole('menu')).not.to.equal(null);
    });
  });

  describe('rendering links', () => {
    function One() {
      return <div>page one</div>;
    }
    function Two() {
      return <div>page two</div>;
    }
    function LocationDisplay() {
      const location = useLocation();
      return <div data-testid="location">{location.pathname}</div>;
    }

    it('@solidjs/router <A>', async () => {
      const { getAllByRole, getByTestId, user } = render(() => (
        <Router>
          <Route
            component={(props) => (
              <>
                {props.children}
                <LocationDisplay />

                <Menu.Root open>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.Item render={(p) => <A {...p()} href="/" />}>link 1</Menu.Item>
                        <Menu.Item render={(p) => <A {...p()} href="/two" />}>link 2</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </>
            )}
          >
            <Route path="/" component={One} />
            <Route path="/two" component={Two} />
          </Route>
        </Router>
      ));

      const link1 = () => screen.getAllByRole('menuitem')[0];
      const link2 = () => screen.getAllByRole('menuitem')[1];

      const locationDisplay = getByTestId('location');

      expect(screen.getByText(/page one/i)).not.to.equal(null);

      expect(locationDisplay).to.have.text('/');

      link2().focus();

      await waitFor(() => {
        expect(link2()).toHaveFocus();
      });

      await user.keyboard('[Enter]');

      expect(locationDisplay).to.have.text('/two');

      expect(screen.getByText(/page two/i)).not.to.equal(null);

      // TODO: why is this needed?
      link1().focus();
      link1().focus();

      await user.keyboard('[Enter]');

      expect(screen.getByText(/page one/i)).not.to.equal(null);

      expect(locationDisplay).to.have.text('/');
    });
  });

  describe('disabled state', () => {
    it('can be focused but not interacted with when disabled', async () => {
      const handleClick = spy();
      const handleKeyDown = spy();
      const handleKeyUp = spy();

      render(() => (
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item
                  disabled
                  onClick={handleClick}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                >
                  Item
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      ));

      const item = screen.getByRole('menuitem');
      item.focus();
      expect(item).toHaveFocus();

      fireEvent.keyDown(item, { key: 'Enter' });
      expect(handleKeyDown.callCount).to.equal(0);
      expect(handleClick.callCount).to.equal(0);

      fireEvent.keyUp(item, { key: 'Space' });
      expect(handleKeyUp.callCount).to.equal(0);
      expect(handleClick.callCount).to.equal(0);

      fireEvent.click(item);
      expect(handleKeyDown.callCount).to.equal(0);
      expect(handleKeyUp.callCount).to.equal(0);
      expect(handleClick.callCount).to.equal(0);
    });
  });
});
