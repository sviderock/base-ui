import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Progress } from '@base-ui-components/solid/progress';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Progress.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(Progress.Indicator, () => ({
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <Progress.Root value={40}>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Progress.Root>
        ),
        elementProps,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  describe.skipIf(isJSDOM)('internal styles', () => {
    it('determinate', async () => {
      render(() => (
        <Progress.Root value={33}>
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" render={(p) => <span {...p()} />} />
          </Progress.Track>
        </Progress.Root>
      ));

      const indicator = screen.getByTestId('indicator');

      expect(indicator).toHaveComputedStyle({
        insetInlineStart: '0px',
        width: '33%',
      });
    });

    it('sets zero width when value is 0', async () => {
      render(() => (
        <Progress.Root value={0}>
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ));

      const indicator = screen.getByTestId('indicator');

      expect(indicator).toHaveComputedStyle({
        insetInlineStart: '0px',
        width: '0px',
      });
    });

    it('indeterminate', async () => {
      render(() => (
        <Progress.Root value={null}>
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ));

      const indicator = screen.getByTestId('indicator');

      expect(indicator).toHaveComputedStyle({});
    });
  });
});
