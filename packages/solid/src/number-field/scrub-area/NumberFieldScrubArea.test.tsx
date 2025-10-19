import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { NumberField } from '@base-ui-components/solid/number-field';
import { screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';
import { isWebKit } from '../../utils/detectBrowser';

function createPointerMoveEvent({ movementX = 0, movementY = 0 }) {
  return new PointerEvent('pointermove', {
    bubbles: true,
    movementX,
    movementY,
  });
}

describe('<NumberField.ScrubArea />', () => {
  const { render } = createRenderer();

  describeConformance(NumberField.ScrubArea, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <NumberField.Root>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </NumberField.Root>
        ),
        elementProps,
      );
    },
  }));

  it('has presentation role', async () => {
    render(() => (
      <NumberField.Root>
        <NumberField.ScrubArea />
      </NumberField.Root>
    ));
    expect(screen.queryByRole('presentation')).not.to.equal(null);
  });

  // Only run the following tests in Chromium/Firefox.
  if (isJSDOM || isWebKit) {
    return;
  }

  // `PointerEvent` isn't defined in JSDOM. This needs to be located beneath the return above.
  const pointerDownEvent = new PointerEvent('pointerdown', {
    bubbles: true,
    clientX: 100,
    clientY: 100,
  });

  it('should increment or decrement the value when scrubbing with the pointer', async () => {
    render(() => (
      <NumberField.Root defaultValue={0}>
        <NumberField.Input />
        <NumberField.ScrubArea data-testid="scrub-area">
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
      </NumberField.Root>
    ));

    const scrubArea = screen.getByTestId('scrub-area');
    const input = screen.getByRole('textbox');

    scrubArea.dispatchEvent(pointerDownEvent);
    scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -10 }));

    await waitFor(() => expect(input).to.have.value('-10'));
    scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 5 }));

    await waitFor(() => expect(input).to.have.value('-5'));

    scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -2 }));

    await waitFor(() => expect(input).to.have.value('-7'));
  });

  describe('prop: pixelSensitivity', () => {
    it('should only increment if the pointer movement was greater than or equal to the value', async () => {
      render(() => (
        <NumberField.Root defaultValue={0}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area" pixelSensitivity={5}>
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
        </NumberField.Root>
      ));

      const scrubArea = screen.getByTestId('scrub-area');
      const input = screen.getByRole('textbox');

      scrubArea.dispatchEvent(pointerDownEvent);
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -2 }));

      await waitFor(() => expect(input).to.have.value('0'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 2 }));

      await waitFor(() => expect(input).to.have.value('0'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));

      await waitFor(() => expect(input).to.have.value('0'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));

      await waitFor(() => expect(input).to.have.value('1'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 5 }));

      await waitFor(() => expect(input).to.have.value('6'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -4 }));

      await waitFor(() => expect(input).to.have.value('6'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -1 }));

      await waitFor(() => expect(input).to.have.value('5'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 5 }));

      await waitFor(() => expect(input).to.have.value('10'));
    });
  });

  describe('prop: direction', () => {
    it('should only scrub if the pointer moved in the given direction', async () => {
      render(() => (
        <NumberField.Root defaultValue={0}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area" direction="horizontal">
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
        </NumberField.Root>
      ));

      const scrubArea = screen.getByTestId('scrub-area');
      const input = screen.getByRole('textbox');

      scrubArea.dispatchEvent(pointerDownEvent);
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 10 }));

      await waitFor(() => expect(input).to.have.value('10'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 10 }));

      await waitFor(() => expect(input).to.have.value('10'));
    });
  });
});
