import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Radio } from '@base-ui-components/solid/radio';
import { RadioGroup } from '@base-ui-components/solid/radio-group';
import { screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';

describe('<Radio.Indicator />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describeConformance(Radio.Indicator, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Radio.Root value="">
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Radio.Root>
        ),
        elementProps,
      );
    },
  }));

  it('should remove the indicator when there is no exit animation defined', async ({ skip }) => {
    if (isJSDOM) {
      skip();
    }

    function Test() {
      const [value, setValue] = createSignal('a');
      return (
        <div>
          <button onClick={() => setValue('b')}>Close</button>
          <RadioGroup value={value}>
            <Radio.Root value="a">
              <Radio.Indicator class="animation-test-indicator" data-testid="indicator-a" />
            </Radio.Root>
            <Radio.Root value="a">
              <Radio.Indicator class="animation-test-indicator" />
            </Radio.Root>
          </RadioGroup>
        </div>
      );
    }

    const { user } = render(() => <Test />);

    expect(screen.getByTestId('indicator-a')).not.to.equal(null);

    const closeButton = screen.getByText('Close');

    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('indicator-a')).to.equal(null);
    });
  });

  it('should remove the indicator when the animation finishes', async ({ skip }) => {
    if (isJSDOM) {
      skip();
    }

    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    let animationFinished = false;
    const notifyAnimationFinished = () => {
      animationFinished = true;
    };

    function Test() {
      const style = `
        @keyframes test-anim {
          to {
            opacity: 0;
          }
        }

        .animation-test-indicator[data-ending-style] {
          animation: test-anim 1ms;
        }
      `;

      const [value, setValue] = createSignal('a');

      return (
        <div>
          {/* eslint-disable-next-line solid/no-innerhtml */}
          <style innerHTML={style} />
          <button onClick={() => setValue('b')}>Close</button>
          <RadioGroup value={value}>
            <Radio.Root value="a">
              <Radio.Indicator
                class="animation-test-indicator"
                keepMounted
                onAnimationEnd={notifyAnimationFinished}
                data-testid="indicator-a"
              />
            </Radio.Root>
            <Radio.Root value="a">
              <Radio.Indicator class="animation-test-indicator" keepMounted />
            </Radio.Root>
          </RadioGroup>
        </div>
      );
    }

    const { user } = render(() => <Test />);

    expect(screen.getByTestId('indicator-a')).not.to.equal(null);

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    await waitFor(() => {
      expect(animationFinished).to.equal(true);
    });
  });
});
