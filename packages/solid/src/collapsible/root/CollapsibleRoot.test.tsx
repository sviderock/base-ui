'use client';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Collapsible } from '@base-ui-components/solid/collapsible';
import { screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { createSignal } from 'solid-js';

const PANEL_CONTENT = 'This is panel content';

describe('test', () => {
  const { render } = createRenderer();
  it('test', async () => {
    const { user } = render(() => (
      <Collapsible.Root>
        <Collapsible.Trigger />
      </Collapsible.Root>
    ));

    screen.debug();
    const key = 'Enter';
    const trigger = screen.getByRole('button');
    await user.keyboard('[Tab]');
    expect(trigger).toHaveFocus();
    console.log('pressing', key);
    await user.keyboard(`[${key}]`);
    console.log('pressed', key);

    await user.keyboard(`[${key}]`);
  });
});

describe('<Collapsible.Root />', () => {
  const { render } = createRenderer();
  describeConformance(Collapsible.Root, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('ARIA attributes', () => {
    it('sets ARIA attributes', () => {
      const { getByTestId, getByRole } = render(() => (
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel" />
        </Collapsible.Root>
      ));

      const trigger = getByRole('button');
      const panel = getByTestId('panel');

      expect(trigger).to.have.attribute('aria-expanded');
      expect(trigger).to.have.attribute('aria-controls');
      expect(trigger.getAttribute('aria-controls')).to.equal(panel.getAttribute('id'));
    });

    it('references manual panel id in trigger aria-controls', () => {
      const { getByTestId, getByRole } = render(() => (
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger />
          <Collapsible.Panel id="custom-panel-id" data-testid="panel" />
        </Collapsible.Root>
      ));

      const trigger = getByRole('button');
      const panel = getByTestId('panel');

      expect(trigger).to.have.attribute('aria-controls', 'custom-panel-id');
      expect(panel).to.have.attribute('id', 'custom-panel-id');
    });
  });

  describe('collapsible status', () => {
    it('disabled status', () => {
      const { getByRole } = render(() => (
        <Collapsible.Root disabled>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel" />
        </Collapsible.Root>
      ));

      const trigger = getByRole('button');

      expect(trigger).to.have.attribute('data-disabled');
    });
  });

  describe.skipIf(isJSDOM)('open state', () => {
    it('controlled mode', async () => {
      function App() {
        const [open, setOpen] = createSignal(false);
        return (
          <>
            <Collapsible.Root open={open()}>
              <Collapsible.Trigger>trigger</Collapsible.Trigger>
              <Collapsible.Panel>This is panel content</Collapsible.Panel>
            </Collapsible.Root>
            <button type="button" onClick={() => setOpen(!open())}>
              toggle
            </button>
          </>
        );
      }

      const { getByRole, queryByText } = render(() => <App />);

      let externalTrigger!: HTMLElement;
      let trigger!: HTMLElement;
      function updateTriggers() {
        externalTrigger = getByRole('button', { name: 'toggle' });
        trigger = getByRole('button', { name: 'trigger' });
      }

      updateTriggers();
      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT)).to.equal(null);

      await userEvent.click(externalTrigger);
      updateTriggers();

      // Re-query for trigger after state change
      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('aria-controls');

      expect(queryByText(PANEL_CONTENT)).to.not.equal(null);
      expect(queryByText(PANEL_CONTENT)).toBeVisible();
      expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      await userEvent.click(externalTrigger);
      updateTriggers();

      // Re-query for trigger after state change
      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT)).to.equal(null);
    });

    it('uncontrolled mode', async () => {
      const { getByRole, queryByText } = render(() => (
        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is panel content</Collapsible.Panel>
        </Collapsible.Root>
      ));

      let trigger = getByRole('button');

      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT)).to.equal(null);

      await userEvent.pointer({ keys: '[MouseLeft]', target: trigger });

      trigger = getByRole('button');

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('aria-controls');
      expect(queryByText(PANEL_CONTENT)).to.not.equal(null);
      expect(queryByText(PANEL_CONTENT)).toBeVisible();
      expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      await userEvent.pointer({ keys: '[MouseLeft]', target: trigger });

      trigger = getByRole('button');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.not.have.attribute('data-panel-open');
      expect(queryByText(PANEL_CONTENT)).to.equal(null);
    });
  });

  describe('prop: render', () => {
    it('does not render a root element when `null`', () => {
      const { getByRole, container } = render(() => (
        <Collapsible.Root defaultOpen render={null}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is panel content</Collapsible.Panel>
        </Collapsible.Root>
      ));

      const trigger = getByRole('button');
      expect(container.firstElementChild as HTMLElement).to.equal(trigger);
    });
  });

  describe.skipIf(isJSDOM)('keyboard interactions', () => {
    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} should toggle the Collapsible`, async () => {
        const { queryByText, getByRole, user } = render(() => (
          <Collapsible.Root defaultOpen={false}>
            <Collapsible.Trigger>Trigger</Collapsible.Trigger>
            <Collapsible.Panel>This is panel content</Collapsible.Panel>
          </Collapsible.Root>
        ));

        let trigger = getByRole('button');

        expect(trigger).to.not.have.attribute('aria-controls');
        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(queryByText(PANEL_CONTENT)).to.equal(null);

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        console.log('pressing', key);
        await user.keyboard(`[${key}]`);
        console.log('pressed', key);

        trigger = getByRole('button');

        expect(trigger).to.have.attribute('aria-controls');
        expect(trigger).to.have.attribute('aria-expanded', 'true');
        expect(trigger).to.have.attribute('data-panel-open');
        expect(queryByText(PANEL_CONTENT)).toBeVisible();
        expect(queryByText(PANEL_CONTENT)).to.not.equal(null);
        expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-open');

        console.log('pressing second time', key);
        await user.keyboard(`[${key}]`);
        console.log('pressed second time', key);

        trigger = getByRole('button');

        // expect(trigger).to.not.have.attribute('aria-controls');
        // expect(trigger).to.have.attribute('aria-expanded', 'false');
        // expect(trigger).not.to.have.attribute('data-panel-open');
        // expect(queryByText(PANEL_CONTENT)).to.equal(null);
      });
    });
  });
});
