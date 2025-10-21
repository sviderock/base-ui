import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Tabs } from '@base-ui-components/solid/tabs';
import { screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';

describe('<Tabs.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(Tabs.Indicator, () => ({
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <Tabs.Root defaultValue={1}>
            <Tabs.List>
              <Tabs.Tab value={1} />
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </Tabs.List>
          </Tabs.Root>
        ),
        elementProps,
      );
    },
    refInstanceof: window.HTMLSpanElement,
    testRenderPropWith: 'div',
  }));

  describe.skipIf(isJSDOM)('rendering', () => {
    it('should not render when no tab is selected', async () => {
      render(() => (
        <Tabs.Root value={null}>
          <Tabs.List>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>
      ));

      expect(screen.queryByTestId('bubble')).to.equal(null);
    });

    function assertSize(actual: string, expected: number) {
      const actualNumber = parseFloat(actual);
      expect(actualNumber).to.be.closeTo(expected, 0.01);
    }

    function assertBubblePositionVariables(
      bubble: HTMLElement,
      tabList: HTMLElement,
      activeTab: HTMLElement,
    ) {
      const relativeLeft = activeTab.offsetLeft - tabList.clientLeft;
      const relativeRight =
        tabList.scrollWidth - activeTab.offsetLeft - activeTab.offsetWidth - tabList.clientLeft;
      const relativeTop = activeTab.offsetTop - tabList.clientTop;
      const relativeBottom =
        tabList.scrollHeight - activeTab.offsetTop - activeTab.offsetHeight - tabList.clientTop;

      const bubbleComputedStyle = window.getComputedStyle(bubble);
      const actualLeft = bubbleComputedStyle.getPropertyValue('--active-tab-left');
      const actualRight = bubbleComputedStyle.getPropertyValue('--active-tab-right');
      const actualTop = bubbleComputedStyle.getPropertyValue('--active-tab-top');
      const actualBottom = bubbleComputedStyle.getPropertyValue('--active-tab-bottom');
      const actualWidth = bubbleComputedStyle.getPropertyValue('--active-tab-width');
      const actualHeight = bubbleComputedStyle.getPropertyValue('--active-tab-height');

      assertSize(actualLeft, relativeLeft);
      assertSize(actualRight, relativeRight);
      assertSize(actualTop, relativeTop);
      assertSize(actualBottom, relativeBottom);
      assertSize(actualWidth, activeTab.offsetWidth);
      assertSize(actualHeight, activeTab.offsetHeight);
    }

    it('should set CSS variables corresponding to the active tab', async () => {
      render(() => (
        <Tabs.Root value={2}>
          <Tabs.List>
            <Tabs.Tab value={1}>One</Tabs.Tab>
            <Tabs.Tab value={2}>Two</Tabs.Tab>
            <Tabs.Tab value={3}>Three</Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>
      ));

      const bubble = screen.getByTestId('bubble');
      const tabs = screen.getAllByRole('tab');
      const activeTab = tabs[1];
      const tabList = screen.getByRole('tablist');

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });
    });

    it('should update the position and movement variables when the active tab changes', async () => {
      const [value, setValue] = createSignal(2);
      render(() => (
        <Tabs.Root value={value}>
          <Tabs.List>
            <Tabs.Tab value={1}>One</Tabs.Tab>
            <Tabs.Tab value={2}>Two</Tabs.Tab>
            <Tabs.Tab value={3}>Three</Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>
      ));

      setValue(3);

      const bubble = screen.getByTestId('bubble');
      const tabs = screen.getAllByRole('tab');
      let activeTab = tabs[2];
      const tabList = screen.getByRole('tablist');

      assertBubblePositionVariables(bubble, tabList, activeTab);

      setValue(1);
      activeTab = tabs[0];
      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });
    });

    it('should update the position variables when the tab list is resized', async () => {
      const [style, setStyle] = createSignal({ width: '400px' });
      render(() => (
        <Tabs.Root value={1} style={style()}>
          <Tabs.List style={{ display: 'flex' }}>
            <Tabs.Tab value={1} style={{ flex: '1 1 auto' }}>
              One
            </Tabs.Tab>
            <Tabs.Tab value={2} style={{ flex: '1 1 auto' }}>
              Two
            </Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>
      ));

      const bubble = screen.getByTestId('bubble');
      const tabs = screen.getAllByRole('tab');
      const activeTab = tabs[0];
      const tabList = screen.getByRole('tablist');

      assertBubblePositionVariables(bubble, tabList, activeTab);

      setStyle({ width: '800px' });

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });
    });
  });
});
