import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import {
  DirectionProvider,
  type TextDirection,
} from '@base-ui-components/solid/direction-provider';
import { Toggle } from '@base-ui-components/solid/toggle';
import { ToggleGroup } from '@base-ui-components/solid/toggle-group';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createSignal } from 'solid-js';

describe('<ToggleGroup />', () => {
  const { render } = createRenderer();

  describeConformance(ToggleGroup, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  it('renders a `group`', async () => {
    render(() => <ToggleGroup aria-label="My Toggle Group" />);

    expect(screen.queryByRole('group', { name: 'My Toggle Group' })).not.to.equal(null);
  });

  describe('uncontrolled', () => {
    it('pressed state', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      const { user } = render(() => (
        <ToggleGroup>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ));

      const button1 = () => screen.getAllByRole('button')[0];
      const button2 = () => screen.getAllByRole('button')[1];

      expect(button1()).to.have.attribute('aria-pressed', 'false');
      expect(button2()).to.have.attribute('aria-pressed', 'false');

      await user.pointer({ keys: '[MouseLeft]', target: button1() });

      expect(button1()).to.have.attribute('aria-pressed', 'true');
      expect(button1()).to.have.attribute('data-pressed');
      expect(button2()).to.have.attribute('aria-pressed', 'false');

      await user.pointer({ keys: '[MouseLeft]', target: button2() });

      expect(button2()).to.have.attribute('aria-pressed', 'true');
      expect(button2()).to.have.attribute('data-pressed');
      expect(button1()).to.have.attribute('aria-pressed', 'false');
    });

    it('prop: defaultValue', async () => {
      const { user } = render(() => (
        <ToggleGroup defaultValue={['two']}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ));

      const button1 = () => screen.getAllByRole('button')[0];
      const button2 = () => screen.getAllByRole('button')[1];

      expect(button2()).to.have.attribute('aria-pressed', 'true');
      expect(button2()).to.have.attribute('data-pressed');
      expect(button1()).to.have.attribute('aria-pressed', 'false');

      await user.pointer({ keys: '[MouseLeft]', target: button1() });

      expect(button1()).to.have.attribute('aria-pressed', 'true');
      expect(button1()).to.have.attribute('data-pressed');
      expect(button2()).to.have.attribute('aria-pressed', 'false');
    });
  });

  describe('controlled', () => {
    it('pressed state', async () => {
      const [value, setValue] = createSignal(['two']);
      render(() => (
        <ToggleGroup value={value}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ));

      const button1 = () => screen.getAllByRole('button')[0];
      const button2 = () => screen.getAllByRole('button')[1];

      expect(button1()).to.have.attribute('aria-pressed', 'false');
      expect(button2()).to.have.attribute('aria-pressed', 'true');
      expect(button2()).to.have.attribute('data-pressed');

      setValue(['one']);

      expect(button1()).to.have.attribute('aria-pressed', 'true');
      expect(button1()).to.have.attribute('data-pressed');
      expect(button2()).to.have.attribute('aria-pressed', 'false');

      setValue(['two']);

      expect(button2()).to.have.attribute('aria-pressed', 'true');
      expect(button2()).to.have.attribute('data-pressed');
      expect(button1()).to.have.attribute('aria-pressed', 'false');
    });

    it('prop: value', async () => {
      const [value, setValue] = createSignal(['two']);
      render(() => (
        <ToggleGroup value={value}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ));

      const button1 = () => screen.getAllByRole('button')[0];
      const button2 = () => screen.getAllByRole('button')[1];

      expect(button2()).to.have.attribute('aria-pressed', 'true');
      expect(button2()).to.have.attribute('data-pressed');
      expect(button1()).to.have.attribute('aria-pressed', 'false');

      setValue(['one']);

      expect(button1()).to.have.attribute('aria-pressed', 'true');
      expect(button1()).to.have.attribute('data-pressed');
      expect(button2()).to.have.attribute('aria-pressed', 'false');
    });
  });

  describe('prop: disabled', () => {
    it('can disable the whole group', async () => {
      render(() => (
        <ToggleGroup disabled>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ));

      const [button1, button2] = screen.getAllByRole('button');

      expect(button1).to.have.attribute('aria-disabled', 'true');
      expect(button1).to.have.attribute('data-disabled');
      expect(button2).to.have.attribute('aria-disabled', 'true');
      expect(button2).to.have.attribute('data-disabled');
    });

    it('can disable individual items', async () => {
      render(() => (
        <ToggleGroup>
          <Toggle value="one" />
          <Toggle value="two" disabled />
        </ToggleGroup>
      ));

      const [button1, button2] = screen.getAllByRole('button');

      expect(button1).to.have.attribute('aria-disabled', 'false');
      expect(button1).to.not.have.attribute('data-disabled');
      expect(button2).to.have.attribute('aria-disabled', 'true');
      expect(button2).to.have.attribute('data-disabled');
    });
  });

  describe('prop: orientation', () => {
    it('vertical', async () => {
      render(() => (
        <ToggleGroup orientation="vertical">
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ));

      const group = screen.queryByRole('group');
      expect(group).to.have.attribute('data-orientation', 'vertical');
    });
  });

  describe('prop: toggleMultiple', () => {
    it('multiple items can be pressed when true', async () => {
      const { user } = render(() => (
        <ToggleGroup toggleMultiple defaultValue={['one']}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ));

      const button1 = () => screen.getAllByRole('button')[0];
      const button2 = () => screen.getAllByRole('button')[1];

      expect(button1()).to.have.attribute('aria-pressed', 'true');
      expect(button2()).to.have.attribute('aria-pressed', 'false');

      await user.pointer({ keys: '[MouseLeft]', target: button2() });

      expect(button1()).to.have.attribute('aria-pressed', 'true');
      expect(button2()).to.have.attribute('aria-pressed', 'true');
    });

    it('only one item can be pressed when false', async () => {
      const { user } = render(() => (
        <ToggleGroup toggleMultiple={false} defaultValue={['one']}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ));

      const button1 = () => screen.getAllByRole('button')[0];
      const button2 = () => screen.getAllByRole('button')[1];

      expect(button1()).to.have.attribute('aria-pressed', 'true');
      expect(button2()).to.have.attribute('aria-pressed', 'false');

      await user.pointer({ keys: '[MouseLeft]', target: button2() });

      expect(button1()).to.have.attribute('aria-pressed', 'false');
      expect(button2()).to.have.attribute('aria-pressed', 'true');
    });
  });

  describe.skipIf(isJSDOM)('keyboard interactions', () => {
    [
      ['ltr', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'],
      ['rtl', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'],
    ].forEach((entry) => {
      const [direction, horizontalNextKey, verticalNextKey, horizontalPrevKey, verticalPrevKey] =
        entry;

      it(direction, async () => {
        const { user } = render(() => (
          <DirectionProvider direction={direction as TextDirection}>
            <ToggleGroup>
              <Toggle value="one" />
              <Toggle value="two" />
              <Toggle value="three" />
            </ToggleGroup>
          </DirectionProvider>
        ));

        const button1 = () => screen.getAllByRole('button')[0];
        const button2 = () => screen.getAllByRole('button')[1];
        const button3 = () => screen.getAllByRole('button')[2];

        await user.keyboard('[Tab]');

        expect(button1()).to.have.attribute('tabindex', '0');
        expect(button1()).toHaveFocus();

        await user.keyboard(`[${horizontalNextKey}]`);

        expect(button2()).to.have.attribute('tabindex', '0');
        expect(button2()).toHaveFocus();

        await user.keyboard(`[${horizontalNextKey}]`);

        expect(button3()).to.have.attribute('tabindex', '0');
        expect(button3()).toHaveFocus();

        await user.keyboard(`[${verticalNextKey}]`);

        expect(button1()).to.have.attribute('tabindex', '0');
        expect(button1()).toHaveFocus();

        await user.keyboard(`[${verticalNextKey}]`);

        expect(button2()).to.have.attribute('tabindex', '0');
        expect(button2()).toHaveFocus();

        await user.keyboard(`[${horizontalPrevKey}]`);

        expect(button1()).to.have.attribute('tabindex', '0');
        expect(button1()).toHaveFocus();

        await user.keyboard(`[${verticalPrevKey}]`);

        expect(button3()).to.have.attribute('tabindex', '0');
        expect(button3()).toHaveFocus();
      });
    });

    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} toggles the pressed state`, async () => {
        const { user } = render(() => (
          <ToggleGroup>
            <Toggle value="one" />
            <Toggle value="two" />
          </ToggleGroup>
        ));

        const button1 = () => screen.getAllByRole('button')[0];

        expect(button1()).to.have.attribute('aria-pressed', 'false');

        button1().focus();

        await user.keyboard(`[${key}]`);

        expect(button1()).to.have.attribute('aria-pressed', 'true');

        await user.keyboard(`[${key}]`);

        expect(button1()).to.have.attribute('aria-pressed', 'false');
      });
    });
  });

  describe('prop: onValueChange', () => {
    it('fires when an Item is clicked', async () => {
      const onValueChange = spy();

      const { user } = render(() => (
        <ToggleGroup onValueChange={onValueChange}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ));

      const button1 = () => screen.getAllByRole('button')[0];
      const button2 = () => screen.getAllByRole('button')[1];

      expect(onValueChange.callCount).to.equal(0);

      await user.pointer({ keys: '[MouseLeft]', target: button1() });

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.args[0][0]).to.deep.equal(['one']);

      await user.pointer({ keys: '[MouseLeft]', target: button2() });

      expect(onValueChange.callCount).to.equal(2);
      expect(onValueChange.args[1][0]).to.deep.equal(['two']);
    });

    ['Enter', 'Space'].forEach((key) => {
      it(`fires when when the ${key} is pressed`, async ({ skip }) => {
        if (isJSDOM) {
          skip();
        }

        const onValueChange = spy();

        const { user } = render(() => (
          <ToggleGroup onValueChange={onValueChange}>
            <Toggle value="one" />
            <Toggle value="two" />
          </ToggleGroup>
        ));

        const button1 = () => screen.getAllByRole('button')[0];
        const button2 = () => screen.getAllByRole('button')[1];

        expect(onValueChange.callCount).to.equal(0);

        button1().focus();

        await user.keyboard(`[${key}]`);

        expect(onValueChange.callCount).to.equal(1);
        expect(onValueChange.args[0][0]).to.deep.equal(['one']);

        button2().focus();

        await user.keyboard(`[${key}]`);

        expect(onValueChange.callCount).to.equal(2);
        expect(onValueChange.args[1][0]).to.deep.equal(['two']);
      });
    });
  });
});
