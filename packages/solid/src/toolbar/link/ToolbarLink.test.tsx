import { createRenderer, describeConformance } from '#test-utils';
import { Toolbar } from '@base-ui-components/solid/toolbar';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
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

describe('<Toolbar.Link />', () => {
  const { render } = createRenderer();

  describeConformance(Toolbar.Link, () => ({
    refInstanceof: window.HTMLAnchorElement,
    testRenderPropWith: 'a',
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
    it('renders an anchor', async () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Link data-testid="link" href="https://base-ui.com" />
        </Toolbar.Root>
      ));

      expect(screen.getByTestId('link')).to.equal(screen.getByRole('link'));
    });
  });
});
