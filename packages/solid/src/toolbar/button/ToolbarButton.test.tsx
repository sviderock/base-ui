import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { AlertDialog } from '@base-ui-components/solid/alert-dialog';
import { Dialog } from '@base-ui-components/solid/dialog';
import { Menu } from '@base-ui-components/solid/menu';
import { Popover } from '@base-ui-components/solid/popover';
import { Select } from '@base-ui-components/solid/select';
import { Switch } from '@base-ui-components/solid/switch';
import { Toggle } from '@base-ui-components/solid/toggle';
import { ToggleGroup } from '@base-ui-components/solid/toggle-group';
import { Toolbar } from '@base-ui-components/solid/toolbar';
import { screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Dynamic } from 'solid-js/web';
import { CompositeRootContext } from '../../composite/root/CompositeRootContext';
import { NOOP } from '../../utils/noop';
import { ToolbarRootContext } from '../root/ToolbarRootContext';

const testCompositeContext: CompositeRootContext = {
  highlightedIndex: () => 0,
  onHighlightedIndexChange: NOOP,
  highlightItemOnHover: () => false,
};

const testToolbarContext: ToolbarRootContext = {
  disabled: () => false,
  orientation: () => 'horizontal',
  setItemArray: NOOP,
};

describe('<Toolbar.Button />', () => {
  const { render } = createRenderer();

  describeConformance(Toolbar.Button, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <ToolbarRootContext.Provider value={testToolbarContext}>
            <CompositeRootContext.Provider value={testCompositeContext}>
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </CompositeRootContext.Provider>
          </ToolbarRootContext.Provider>
        ),
        elementProps,
      );
    },
  }));

  describe('ARIA attributes', () => {
    it('renders a button', async () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Button data-testid="button" />
        </Toolbar.Root>
      ));

      expect(screen.getByTestId('button')).to.equal(screen.getByRole('button'));
    });
  });

  describe('prop: disabled', () => {
    it('disables the button', async () => {
      const handleClick = spy();
      const handleMouseDown = spy();
      const handlePointerDown = spy();
      const handleKeyDown = spy();

      const { user } = render(() => (
        <Toolbar.Root>
          <Toolbar.Button
            disabled
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
          />
        </Toolbar.Root>
      ));

      const button = screen.getByRole('button');

      expect(button).to.not.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
      expect(button).to.have.attribute('aria-disabled', 'true');

      await user.click(button);
      await user.keyboard(`[Space]`);
      await user.keyboard(`[Enter]`);
      expect(handleClick.callCount).to.equal(0);
      expect(handleMouseDown.callCount).to.equal(0);
      expect(handlePointerDown.callCount).to.equal(0);
      expect(handleKeyDown.callCount).to.equal(0);
    });
  });

  describe('rendering other Base UI components', () => {
    describe('Switch', () => {
      it('renders a switch', async () => {
        render(() => (
          <Toolbar.Root>
            <Toolbar.Button data-testid="button" render={(p) => <Switch.Root {...p()} />} />
          </Toolbar.Root>
        ));

        expect(screen.getByTestId('button')).to.equal(screen.getByRole('switch'));
      });

      it('handles interactions', async () => {
        const handleCheckedChange = spy();
        const handleClick = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Toolbar.Button
              onClick={handleClick}
              render={(p) => (
                <Switch.Root
                  {...p()}
                  defaultChecked={false}
                  onCheckedChange={handleCheckedChange}
                />
              )}
            />
          </Toolbar.Root>
        ));

        const switchElement = () => screen.getByRole('switch');
        expect(switchElement()).to.have.attribute('data-unchecked');

        await user.keyboard('[Tab]');
        expect(switchElement()).to.have.attribute('tabindex', '0');

        await user.click(switchElement());
        expect(handleCheckedChange.callCount).to.equal(1);
        expect(handleClick.callCount).to.equal(1);
        expect(switchElement()).to.have.attribute('data-checked');

        await user.keyboard('[Enter]');
        expect(handleCheckedChange.callCount).to.equal(2);
        expect(handleClick.callCount).to.equal(2);
        expect(switchElement()).to.have.attribute('data-unchecked');

        await user.keyboard('[Space]');
        expect(handleCheckedChange.callCount).to.equal(3);
        expect(handleClick.callCount).to.equal(3);
        expect(switchElement()).to.have.attribute('data-checked');
      });

      it('disabled state', async () => {
        const handleCheckedChange = spy();
        const handleClick = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Toolbar.Button
              disabled
              onClick={handleClick}
              render={(p) => <Switch.Root {...p()} onCheckedChange={handleCheckedChange} />}
            />
          </Toolbar.Root>
        ));

        const switchElement = () => screen.getByRole('switch');

        expect(switchElement()).to.not.have.attribute('disabled');
        expect(switchElement()).to.have.attribute('data-disabled');
        expect(switchElement()).to.have.attribute('aria-disabled', 'true');

        await user.keyboard('[Tab]');
        expect(switchElement()).to.have.attribute('tabindex', '0');

        await user.keyboard('[Enter]');
        expect(handleCheckedChange.callCount).to.equal(0);
        expect(handleClick.callCount).to.equal(0);

        await user.keyboard('[Space]');
        expect(handleCheckedChange.callCount).to.equal(0);
        expect(handleClick.callCount).to.equal(0);

        await user.click(switchElement());
        expect(handleCheckedChange.callCount).to.equal(0);
        expect(handleClick.callCount).to.equal(0);
      });
    });

    describe('Menu', () => {
      it('renders a menu trigger', async () => {
        render(() => (
          <Toolbar.Root>
            <Menu.Root>
              <Toolbar.Button
                data-testid="button"
                render={(p) => <Menu.Trigger {...p()}>Toggle</Menu.Trigger>}
              />
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item data-testid="item-1">1</Menu.Item>
                    <Menu.Item data-testid="item-2">2</Menu.Item>
                    <Menu.Item data-testid="item-3">3</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Toolbar.Root>
        ));

        expect(screen.getByTestId('button')).to.have.attribute('aria-haspopup', 'menu');
      });

      it('handles interactions', async () => {
        const handleOpenChange = spy();
        const handleClick = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Menu.Root onOpenChange={handleOpenChange}>
              <Toolbar.Button
                data-testid="button"
                onClick={handleClick}
                render={(p) => <Menu.Trigger {...p()}>Toggle</Menu.Trigger>}
              />
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item data-testid="item-1">1</Menu.Item>
                    <Menu.Item data-testid="item-2">2</Menu.Item>
                    <Menu.Item data-testid="item-3">3</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Toolbar.Root>
        ));

        expect(screen.queryByRole('menu')).to.equal(null);

        const trigger = () => screen.getByRole('button', { name: 'Toggle' });

        await user.keyboard('[Tab]');
        expect(trigger()).toHaveFocus();

        await user.keyboard('[Enter]');
        expect(handleClick.callCount).to.equal(1);
        expect(handleOpenChange.callCount).to.equal(1);
        expect(screen.queryByRole('menu')).to.not.equal(null);

        await waitFor(() => {
          expect(screen.getByTestId('item-1')).toHaveFocus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(screen.getByTestId('item-2')).toHaveFocus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(screen.getByTestId('item-3')).toHaveFocus();
        });

        await user.keyboard('[ArrowUp]');
        await waitFor(() => {
          expect(screen.getByTestId('item-2')).toHaveFocus();
        });

        await user.keyboard('[Escape]');
        await waitFor(() => {
          expect(screen.queryByRole('menu')).to.equal(null);
        });

        expect(handleOpenChange.callCount).to.equal(2);

        await waitFor(() => {
          expect(trigger()).toHaveFocus();
        });
      });

      it('disabled state', async () => {
        const handleOpenChange = spy();
        const handleClick = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Menu.Root onOpenChange={handleOpenChange}>
              <Toolbar.Button
                data-testid="button"
                disabled
                onClick={handleClick}
                render={(p) => <Menu.Trigger {...p()}>Toggle</Menu.Trigger>}
              />
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item data-testid="item-1">1</Menu.Item>
                    <Menu.Item data-testid="item-2">2</Menu.Item>
                    <Menu.Item data-testid="item-3">3</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Toolbar.Root>
        ));

        const trigger = () => screen.getByRole('button', { name: 'Toggle' });
        expect(trigger()).to.not.have.attribute('disabled');
        expect(trigger()).to.have.attribute('data-disabled');
        expect(trigger()).to.have.attribute('aria-disabled', 'true');

        expect(screen.queryByRole('menu')).to.equal(null);

        await user.keyboard('[Tab]');
        expect(trigger()).toHaveFocus();

        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');

        expect(handleClick.callCount).to.equal(0);
        expect(handleOpenChange.callCount).to.equal(0);
        expect(screen.queryByRole('menu')).to.equal(null);
      });
    });

    describe('Select', () => {
      it('renders a select trigger', async () => {
        render(() => (
          <Toolbar.Root>
            <Select.Root defaultValue="a">
              <Toolbar.Button data-testid="button" render={(p) => <Select.Trigger {...p()} />} />
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="a">a</Select.Item>
                    <Select.Item value="b">b</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Toolbar.Root>
        ));

        const trigger = () => screen.getByTestId('button');
        expect(trigger()).to.equal(screen.getByRole('combobox'));
        expect(trigger()).to.have.attribute('aria-haspopup', 'listbox');
      });

      it.skipIf(!isJSDOM)('handles interactions', async () => {
        const handleValueChange = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Select.Root defaultValue="a" onValueChange={handleValueChange}>
              <Toolbar.Button data-testid="button" render={(p) => <Select.Trigger {...p()} />} />
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup data-testid="popup">
                    <Select.Item value="a" data-testid="item-a">
                      a
                    </Select.Item>
                    <Select.Item value="b" data-testid="item-b">
                      b
                    </Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Toolbar.Root>
        ));

        expect(screen.queryByRole('listbox')).to.equal(null);

        const trigger = () => screen.getByTestId('button');
        await user.keyboard('[Tab]');
        expect(trigger()).toHaveFocus();

        await user.keyboard('[ArrowDown]');
        expect(screen.queryByRole('listbox')).to.equal(screen.getByTestId('popup'));
        await waitFor(() => {
          expect(screen.getByRole('option', { name: 'a' })).toHaveFocus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(screen.getByRole('option', { name: 'b' })).toHaveFocus();
        });

        await user.keyboard('[Enter]');
        await waitFor(() => {
          expect(screen.queryByRole('listbox')).to.equal(null);
        });

        await waitFor(() => {
          expect(trigger()).toHaveFocus();
        });

        expect(handleValueChange.callCount).to.equal(1);
        expect(handleValueChange.args[0][0]).to.equal('b');
      });

      it('disabled state', async () => {
        const onValueChange = spy();
        const onOpenChange = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Select.Root defaultValue="a" onValueChange={onValueChange} onOpenChange={onOpenChange}>
              <Toolbar.Button disabled render={(p) => <Select.Trigger {...p()} />} />
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="a" />
                    <Select.Item value="b" />
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Toolbar.Root>
        ));

        expect(screen.queryByRole('listbox')).to.equal(null);

        const trigger = () => screen.getByRole('combobox');
        expect(trigger()).to.not.have.attribute('disabled');
        expect(trigger()).to.have.attribute('data-disabled');
        expect(trigger()).to.have.attribute('aria-disabled', 'true');

        await user.keyboard('[Tab]');
        expect(trigger()).toHaveFocus();

        expect(onOpenChange.callCount).to.equal(0);
        expect(onValueChange.callCount).to.equal(0);

        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');
        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');

        expect(onOpenChange.callCount).to.equal(0);
        expect(onValueChange.callCount).to.equal(0);
      });
    });

    describe('Dialog', () => {
      it('renders a dialog trigger', async () => {
        render(() => (
          <Toolbar.Root>
            <Dialog.Root modal={false}>
              <Toolbar.Button render={(p) => <Dialog.Trigger {...p()} data-testid="trigger" />} />
              <Dialog.Portal>
                <Dialog.Backdrop />
                <Dialog.Popup>
                  <Dialog.Title>title text</Dialog.Title>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Toolbar.Root>
        ));

        expect(screen.getByTestId('trigger')).to.equal(screen.getByRole('button'));
      });

      it('handles interactions', async () => {
        const onOpenChange = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Dialog.Root modal={false} onOpenChange={onOpenChange}>
              <Toolbar.Button render={(p) => <Dialog.Trigger {...p()} />} />
              <Dialog.Portal>
                <Dialog.Backdrop />
                <Dialog.Popup>
                  <Dialog.Title>title text</Dialog.Title>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Toolbar.Root>
        ));

        expect(screen.queryByText('title text')).to.equal(null);

        const trigger = () => screen.getByRole('button');
        await user.keyboard('[Tab]');
        expect(trigger()).toHaveFocus();
        expect(onOpenChange.callCount).to.equal(0);

        await user.keyboard('[Enter]');
        expect(screen.queryByText('title text')).to.not.equal(null);
        expect(onOpenChange.callCount).to.equal(1);
        expect(onOpenChange.firstCall.args[0]).to.equal(true);

        await user.keyboard('[Escape]');
        expect(screen.queryByText('title text')).to.equal(null);
        expect(onOpenChange.callCount).to.equal(2);
        expect(onOpenChange.secondCall.args[0]).to.equal(false);

        await waitFor(() => {
          expect(trigger()).toHaveFocus();
        });
      });

      it('disabled state', async () => {
        const onOpenChange = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Dialog.Root modal={false} onOpenChange={onOpenChange}>
              <Toolbar.Button disabled render={(p) => <Dialog.Trigger {...p()} />} />
              <Dialog.Portal>
                <Dialog.Backdrop />
                <Dialog.Popup>
                  <Dialog.Title>title text</Dialog.Title>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Toolbar.Root>
        ));

        expect(screen.queryByText('title text')).to.equal(null);

        const trigger = () => screen.getByRole('button');
        expect(trigger()).to.not.have.attribute('disabled');
        expect(trigger()).to.have.attribute('data-disabled');
        expect(trigger()).to.have.attribute('aria-disabled', 'true');

        await user.keyboard('[Tab]');
        expect(trigger()).toHaveFocus();
        expect(onOpenChange.callCount).to.equal(0);

        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');
        expect(onOpenChange.callCount).to.equal(0);
      });

      it('prevents composite keydowns from escaping', async () => {
        const onOpenChange = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Dialog.Root modal={false} onOpenChange={onOpenChange}>
              <Toolbar.Button render={(p) => <Dialog.Trigger {...p()} />}>dialog</Toolbar.Button>
              <Dialog.Portal>
                <Dialog.Popup />
              </Dialog.Portal>
            </Dialog.Root>

            <Toolbar.Button>empty</Toolbar.Button>
          </Toolbar.Root>
        ));

        expect(screen.queryByRole('dialog')).to.equal(null);

        const trigger = screen.getByRole('button', { name: 'dialog' });
        await user.click(trigger);

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).toHaveFocus();
        });

        await user.keyboard('{ArrowRight}');

        expect(onOpenChange.lastCall.args[0]).to.equal(true);
      });
    });

    describe('AlertDialog', () => {
      it('renders an alert dialog trigger', async () => {
        render(() => (
          <Toolbar.Root>
            <AlertDialog.Root>
              <Toolbar.Button
                render={(p) => <AlertDialog.Trigger {...p()} data-testid="trigger" />}
              />
              <AlertDialog.Portal>
                <AlertDialog.Backdrop />
                <AlertDialog.Popup>
                  <AlertDialog.Title>title text</AlertDialog.Title>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </Toolbar.Root>
        ));

        expect(screen.getByTestId('trigger')).to.equal(screen.getByRole('button'));
      });

      it('handles interactions', async () => {
        const onOpenChange = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <AlertDialog.Root onOpenChange={onOpenChange}>
              <Toolbar.Button render={(p) => <AlertDialog.Trigger {...p()} />} />
              <AlertDialog.Portal>
                <AlertDialog.Backdrop />
                <AlertDialog.Popup>
                  <AlertDialog.Title>title text</AlertDialog.Title>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </Toolbar.Root>
        ));

        expect(screen.queryByText('title text')).to.equal(null);

        const trigger = () => screen.getByRole('button');
        await user.keyboard('[Tab]');
        expect(trigger()).toHaveFocus();
        expect(onOpenChange.callCount).to.equal(0);

        await user.keyboard('[Enter]');
        expect(screen.queryByText('title text')).to.not.equal(null);
        expect(onOpenChange.callCount).to.equal(1);
        expect(onOpenChange.firstCall.args[0]).to.equal(true);

        await user.keyboard('[Escape]');
        expect(screen.queryByText('title text')).to.equal(null);
        expect(onOpenChange.callCount).to.equal(2);
        expect(onOpenChange.secondCall.args[0]).to.equal(false);

        await waitFor(() => {
          expect(trigger()).toHaveFocus();
        });
      });

      it('disabled state', async () => {
        const onOpenChange = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <AlertDialog.Root onOpenChange={onOpenChange}>
              <Toolbar.Button disabled render={(p) => <AlertDialog.Trigger {...p()} />} />
              <AlertDialog.Portal>
                <AlertDialog.Backdrop />
                <AlertDialog.Popup>
                  <AlertDialog.Title>title text</AlertDialog.Title>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </Toolbar.Root>
        ));

        expect(screen.queryByText('title text')).to.equal(null);

        const trigger = () => screen.getByRole('button');
        expect(trigger()).to.not.have.attribute('disabled');
        expect(trigger()).to.have.attribute('data-disabled');
        expect(trigger()).to.have.attribute('aria-disabled', 'true');

        await user.keyboard('[Tab]');
        expect(trigger()).toHaveFocus();
        expect(onOpenChange.callCount).to.equal(0);

        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');
        expect(onOpenChange.callCount).to.equal(0);
      });

      it('prevents composite keydowns from escaping', async () => {
        const onOpenChange = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <AlertDialog.Root onOpenChange={onOpenChange}>
              <Toolbar.Button render={(p) => <AlertDialog.Trigger {...p()} />}>
                dialog
              </Toolbar.Button>
              <AlertDialog.Portal>
                <AlertDialog.Popup />
              </AlertDialog.Portal>
            </AlertDialog.Root>

            <Toolbar.Button>empty</Toolbar.Button>
          </Toolbar.Root>
        ));

        expect(screen.queryByRole('dialog')).to.equal(null);

        const trigger = () => screen.getByRole('button', { name: 'dialog' });
        await user.click(trigger());

        await waitFor(() => {
          expect(screen.queryByRole('alertdialog')).toHaveFocus();
        });

        await user.keyboard('{ArrowRight}');

        expect(onOpenChange.lastCall.args[0]).to.equal(true);
      });
    });

    describe('Popover', () => {
      it('renders a popover trigger', async () => {
        render(() => (
          <Toolbar.Root>
            <Popover.Root>
              <Toolbar.Button render={(p) => <Popover.Trigger {...p()} data-testid="trigger" />} />
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>Content</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </Toolbar.Root>
        ));

        expect(screen.getByTestId('trigger')).to.equal(screen.getByRole('button'));
        expect(screen.getByRole('button')).to.have.attribute('aria-haspopup', 'dialog');
      });

      it('handles interactions', async () => {
        const onOpenChange = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Popover.Root onOpenChange={onOpenChange}>
              <Toolbar.Button render={(p) => <Popover.Trigger {...p()} />} />
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>Content</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </Toolbar.Root>
        ));

        expect(screen.queryByText('Content')).to.equal(null);

        const trigger = () => screen.getByRole('button');
        await user.keyboard('[Tab]');
        expect(trigger()).toHaveFocus();
        expect(onOpenChange.callCount).to.equal(0);

        await user.keyboard('[Enter]');
        expect(screen.queryByText('Content')).to.not.equal(null);
        expect(onOpenChange.callCount).to.equal(1);
        expect(onOpenChange.args[0][0]).to.equal(true);

        await user.keyboard('[Escape]');
        expect(onOpenChange.callCount).to.equal(2);
        expect(onOpenChange.args[1][0]).to.equal(false);

        await waitFor(() => {
          expect(trigger()).toHaveFocus();
        });
      });

      it('disabled state', async () => {
        const onOpenChange = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Popover.Root onOpenChange={onOpenChange}>
              <Toolbar.Button disabled render={(p) => <Popover.Trigger {...p()} />} />
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>Content</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </Toolbar.Root>
        ));

        expect(screen.queryByText('Content')).to.equal(null);

        const trigger = () => screen.getByRole('button');
        expect(trigger()).to.not.have.attribute('disabled');
        expect(trigger()).to.have.attribute('data-disabled');
        expect(trigger()).to.have.attribute('aria-disabled', 'true');

        await user.keyboard('[Tab]');
        expect(trigger()).toHaveFocus();
        expect(onOpenChange.callCount).to.equal(0);

        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');
        expect(onOpenChange.callCount).to.equal(0);
      });
    });

    describe('Toggle and ToggleGroup', () => {
      it('renders toggle and toggle group', async () => {
        render(() => (
          <Toolbar.Root>
            <Toolbar.Button render={(p) => <Toggle {...p()} value="apple" />} />
            <ToggleGroup>
              <Toolbar.Button render={(p) => <Toggle {...p()} value="one" />} />
              <Toolbar.Button render={(p) => <Toggle {...p()} value="two" />} />
            </ToggleGroup>
          </Toolbar.Root>
        ));

        expect(screen.getAllByRole('button').length).to.equal(3);
        screen.getAllByRole('button').forEach((button) => {
          expect(button).to.have.attribute('aria-pressed');
        });
      });

      it('handles interactions', async () => {
        const onPressedChange = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Toolbar.Button
              render={(p) => <Toggle {...p()} onPressedChange={onPressedChange} />}
              value="apple"
            />
            <ToggleGroup>
              <Toolbar.Button
                render={(p) => <Toggle {...p()} onPressedChange={onPressedChange} />}
                value="one"
              />
              <Toolbar.Button
                render={(p) => <Toggle {...p()} onPressedChange={onPressedChange} />}
                value="two"
              />
            </ToggleGroup>
          </Toolbar.Root>
        ));

        const button1 = () => screen.getAllByRole('button')[0];
        const button2 = () => screen.getAllByRole('button')[1];
        const button3 = () => screen.getAllByRole('button')[2];

        [button1(), button2(), button3()].forEach((button) => {
          expect(button).to.have.attribute('aria-pressed', 'false');
        });
        expect(onPressedChange.callCount).to.equal(0);

        await user.keyboard('[Tab]');
        await waitFor(() => {
          expect(button1()).toHaveFocus();
        });

        await user.keyboard('[Enter]');
        expect(onPressedChange.callCount).to.equal(1);
        expect(button1()).to.have.attribute('aria-pressed', 'true');

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(button2()).toHaveFocus();
        });

        await user.keyboard('[Space]');
        expect(onPressedChange.callCount).to.equal(2);
        expect(button2()).to.have.attribute('aria-pressed', 'true');

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(button3()).toHaveFocus();
        });

        await user.keyboard('[Enter]');
        expect(onPressedChange.callCount).to.equal(3);
        expect(button3()).to.have.attribute('aria-pressed', 'true');
      });

      it('disabled state', async () => {
        const onPressedChange = spy();
        const { user } = render(() => (
          <Toolbar.Root>
            <Toolbar.Button
              disabled
              render={(p) => <Toggle {...p()} onPressedChange={onPressedChange} />}
              value="apple"
            />
            <ToggleGroup>
              <Toolbar.Button
                disabled
                render={(p) => <Toggle {...p()} onPressedChange={onPressedChange} />}
                value="one"
              />
              <Toolbar.Button
                disabled
                render={(p) => <Toggle {...p()} onPressedChange={onPressedChange} />}
                value="two"
              />
            </ToggleGroup>
          </Toolbar.Root>
        ));
        const button1 = () => screen.getAllByRole('button')[0];
        const button2 = () => screen.getAllByRole('button')[1];
        const button3 = () => screen.getAllByRole('button')[2];

        [button1(), button2(), button3()].forEach((button) => {
          expect(button).to.have.attribute('aria-pressed', 'false');
          expect(button).to.not.have.attribute('disabled');
          expect(button).to.have.attribute('data-disabled');
          expect(button).to.have.attribute('aria-disabled', 'true');
        });
        expect(onPressedChange.callCount).to.equal(0);

        await user.keyboard('[Tab]');
        await waitFor(() => {
          expect(button1()).toHaveFocus();
        });
        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        expect(onPressedChange.callCount).to.equal(0);

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(button2()).toHaveFocus();
        });
        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        expect(onPressedChange.callCount).to.equal(0);

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(button3()).toHaveFocus();
        });
        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        expect(onPressedChange.callCount).to.equal(0);
      });
    });
  });
});
