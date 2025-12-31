import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Collapsible } from '@base-ui-components/solid/collapsible';
import { screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { createSignal } from 'solid-js';

const PANEL_CONTENT = 'This is panel content';

describe('<Collapsible.Root />', () => {
  const { render } = createRenderer();
  describeConformance(Collapsible.Root, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('ARIA attributes', () => {
    it('sets ARIA attributes', () => {
      render(() => (
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel" />
        </Collapsible.Root>
      ));

      const trigger = screen.getByRole('button');
      const panel = screen.getByTestId('panel');

      expect(trigger).to.have.attribute('aria-expanded');
      expect(trigger).to.have.attribute('aria-controls');
      expect(trigger.getAttribute('aria-controls')).to.equal(panel.getAttribute('id'));
    });

    it('references manual panel id in trigger aria-controls', () => {
      render(() => (
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger />
          <Collapsible.Panel id="custom-panel-id" data-testid="panel" />
        </Collapsible.Root>
      ));

      const trigger = screen.getByRole('button');
      const panel = screen.getByTestId('panel');

      expect(trigger).to.have.attribute('aria-controls', 'custom-panel-id');
      expect(panel).to.have.attribute('id', 'custom-panel-id');
    });
  });

  describe('collapsible status', () => {
    it('disabled status', () => {
      render(() => (
        <Collapsible.Root disabled>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel" />
        </Collapsible.Root>
      ));

      const trigger = screen.getByRole('button');

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

      render(() => <App />);

      let externalTrigger!: HTMLElement;
      let trigger!: HTMLElement;
      function updateTriggers() {
        externalTrigger = screen.getByRole('button', { name: 'toggle' });
        trigger = screen.getByRole('button', { name: 'trigger' });
      }

      updateTriggers();
      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT)).to.equal(null);

      await userEvent.click(externalTrigger);
      updateTriggers();

      // Re-query for trigger after state change
      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('aria-controls');

      expect(screen.queryByText(PANEL_CONTENT)).to.not.equal(null);
      expect(screen.queryByText(PANEL_CONTENT)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      await userEvent.click(externalTrigger);
      updateTriggers();

      // Re-query for trigger after state change
      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT)).to.equal(null);
    });

    it('uncontrolled mode', async () => {
      render(() => (
        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is panel content</Collapsible.Panel>
        </Collapsible.Root>
      ));

      let trigger = screen.getByRole('button');

      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT)).to.equal(null);

      await userEvent.pointer({ keys: '[MouseLeft]', target: trigger });

      trigger = screen.getByRole('button');

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('aria-controls');
      expect(screen.queryByText(PANEL_CONTENT)).to.not.equal(null);
      expect(screen.queryByText(PANEL_CONTENT)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      await userEvent.pointer({ keys: '[MouseLeft]', target: trigger });

      trigger = screen.getByRole('button');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.not.have.attribute('data-panel-open');
      expect(screen.queryByText(PANEL_CONTENT)).to.equal(null);
    });
  });

  describe('prop: render', () => {
    it('does not render a root element when `null`', () => {
      const { container } = render(() => (
        <Collapsible.Root defaultOpen render={null}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is panel content</Collapsible.Panel>
        </Collapsible.Root>
      ));

      const trigger = screen.getByRole('button');
      expect(container.firstElementChild as HTMLElement).to.equal(trigger);
    });
  });

  describe.skipIf(isJSDOM)('keyboard interactions', () => {
    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} should toggle the Collapsible`, async () => {
        const { user } = render(() => (
          <Collapsible.Root defaultOpen={false}>
            <Collapsible.Trigger>Trigger</Collapsible.Trigger>
            <Collapsible.Panel>This is panel content</Collapsible.Panel>
          </Collapsible.Root>
        ));

        let trigger = screen.getByRole('button');

        expect(trigger).to.not.have.attribute('aria-controls');
        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(screen.queryByText(PANEL_CONTENT)).to.equal(null);

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        await user.keyboard(`[${key}]`);

        trigger = screen.getByRole('button');

        expect(trigger).to.have.attribute('aria-controls');
        expect(trigger).to.have.attribute('aria-expanded', 'true');
        expect(trigger).to.have.attribute('data-panel-open');
        expect(screen.queryByText(PANEL_CONTENT)).toBeVisible();
        expect(screen.queryByText(PANEL_CONTENT)).to.not.equal(null);
        expect(screen.queryByText(PANEL_CONTENT)).to.have.attribute('data-open');

        await user.keyboard(`[${key}]`);

        trigger = screen.getByRole('button');

        expect(trigger).to.not.have.attribute('aria-controls');
        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(trigger).not.to.have.attribute('data-panel-open');
        expect(screen.queryByText(PANEL_CONTENT)).to.equal(null);
      });
    });
  });
});
