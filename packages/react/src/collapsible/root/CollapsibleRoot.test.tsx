'use client';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { screen } from '@testing-library/react';
import { expect } from 'chai';
import * as React from 'react';

const PANEL_CONTENT = 'This is panel content';

describe('<Collapsible.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Collapsible.Root />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('ARIA attributes', () => {
    it('sets ARIA attributes', async () => {
      const { getByTestId, getByRole } = await render(
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel" />
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      const panel = getByTestId('panel');

      expect(trigger).to.have.attribute('aria-expanded');
      expect(trigger).to.have.attribute('aria-controls');
      expect(trigger.getAttribute('aria-controls')).to.equal(panel.getAttribute('id'));
    });

    it('references manual panel id in trigger aria-controls', async () => {
      const { getByTestId, getByRole } = await render(
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger />
          <Collapsible.Panel id="custom-panel-id" data-testid="panel" />
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      const panel = getByTestId('panel');

      expect(trigger).to.have.attribute('aria-controls', 'custom-panel-id');
      expect(panel).to.have.attribute('id', 'custom-panel-id');
    });
  });

  describe('collapsible status', () => {
    it('disabled status', async () => {
      const { getByRole } = await render(
        <Collapsible.Root disabled>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel" />
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');

      expect(trigger).to.have.attribute('data-disabled');
    });
  });

  describe.skipIf(isJSDOM)('open state', () => {
    it('controlled mode', async () => {
      function App() {
        const [open, setOpen] = React.useState(false);
        return (
          <React.Fragment>
            <Collapsible.Root open={open}>
              <Collapsible.Trigger>trigger</Collapsible.Trigger>
              <Collapsible.Panel>This is panel content</Collapsible.Panel>
            </Collapsible.Root>
            <button type="button" onClick={() => setOpen(!open)}>
              toggle
            </button>
          </React.Fragment>
        );
      }
      const { queryByText, getByRole, user } = await render(<App />);

      const externalTrigger = getByRole('button', { name: 'toggle' });
      const trigger = getByRole('button', { name: 'trigger' });

      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT)).to.equal(null);

      await user.click(externalTrigger);

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('aria-controls');

      expect(queryByText(PANEL_CONTENT)).to.not.equal(null);
      expect(queryByText(PANEL_CONTENT)).toBeVisible();
      expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      await user.click(externalTrigger);

      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT)).to.equal(null);
    });

    it('uncontrolled mode', async () => {
      const { getByRole, queryByText, user } = await render(
        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is panel content</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      screen.debug(trigger);

      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT)).to.equal(null);

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('aria-controls');
      expect(queryByText(PANEL_CONTENT)).to.not.equal(null);
      expect(queryByText(PANEL_CONTENT)).toBeVisible();
      expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.not.have.attribute('data-panel-open');
      expect(queryByText(PANEL_CONTENT)).to.equal(null);
    });
  });

  describe('prop: render', () => {
    it('does not render a root element when `null`', async () => {
      const { getByRole, container } = await render(
        <Collapsible.Root defaultOpen render={null}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is panel content</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      expect(container.firstElementChild as HTMLElement).to.equal(trigger);
    });
  });

  describe.skipIf(isJSDOM)('keyboard interactions', () => {
    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} should toggle the Collapsible`, async () => {
        const { queryByText, getByRole, user } = await render(
          <Collapsible.Root defaultOpen={false}>
            <Collapsible.Trigger>Trigger</Collapsible.Trigger>
            <Collapsible.Panel>This is panel content</Collapsible.Panel>
          </Collapsible.Root>,
        );

        const trigger = getByRole('button');

        expect(trigger).to.not.have.attribute('aria-controls');
        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(queryByText(PANEL_CONTENT)).to.equal(null);

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-controls');
        expect(trigger).to.have.attribute('aria-expanded', 'true');
        expect(trigger).to.have.attribute('data-panel-open');
        expect(queryByText(PANEL_CONTENT)).toBeVisible();
        expect(queryByText(PANEL_CONTENT)).to.not.equal(null);
        expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-open');

        await user.keyboard(`[${key}]`);

        expect(trigger).to.not.have.attribute('aria-controls');
        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(trigger).not.to.have.attribute('data-panel-open');
        expect(queryByText(PANEL_CONTENT)).to.equal(null);
      });
    });
  });
});
