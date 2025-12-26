import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Collapsible } from '@base-ui-components/solid/collapsible';
import { fireEvent, screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createSignal } from 'solid-js';

const PANEL_CONTENT = 'This is panel content';

describe('<Collapsible.Panel />', () => {
  const { render } = createRenderer();

  describeConformance(Collapsible.Panel, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node, props) => {
      return render(() => <Collapsible.Root defaultOpen>{node(props)}</Collapsible.Root>);
    },
  }));

  describe('prop: keepMounted', () => {
    it('does not unmount the panel when true', () => {
      function App() {
        const [open, setOpen] = createSignal(false);
        return (
          <Collapsible.Root open={open()} onOpenChange={setOpen}>
            <Collapsible.Trigger />
            <Collapsible.Panel keepMounted>{PANEL_CONTENT}</Collapsible.Panel>
          </Collapsible.Root>
        );
      }

      render(() => <App />);

      const trigger = screen.getByRole('button');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT)).to.not.equal(null);
      expect(screen.queryByText(PANEL_CONTENT)).not.toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT)).to.have.attribute('data-closed');

      fireEvent.click(trigger);

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger.getAttribute('aria-controls')).to.equal(
        screen.queryByText(PANEL_CONTENT)?.getAttribute('id'),
      );

      expect(screen.queryByText(PANEL_CONTENT)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      fireEvent.click(trigger);

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(trigger.getAttribute('aria-controls')).to.equal(null);
      expect(screen.queryByText(PANEL_CONTENT)).not.toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT)).to.have.attribute('data-closed');
    });
  });

  // we test firefox in browserstack which does not support this yet
  describe.skipIf(!('onbeforematch' in window) || isJSDOM)('prop: hiddenUntilFound', () => {
    it('uses `hidden="until-found" to hide panel when true', () => {
      const handleOpenChange = spy();

      render(() => (
        <Collapsible.Root defaultOpen={false} onOpenChange={handleOpenChange}>
          <Collapsible.Trigger />
          <Collapsible.Panel hiddenUntilFound keepMounted>
            {PANEL_CONTENT}
          </Collapsible.Panel>
        </Collapsible.Root>
      ));

      const panel = screen.queryByText(PANEL_CONTENT);

      const event = new window.Event('beforematch', {
        bubbles: true,
        cancelable: false,
      });
      panel?.dispatchEvent(event);

      expect(handleOpenChange.callCount).to.equal(1);
      expect(panel).to.have.attribute('data-open');
    });
  });
});
