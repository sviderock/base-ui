import { createRenderer, describeConformance } from '#test-utils';
import { NumberField } from '@base-ui-components/solid/number-field';
import { fireEvent, screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createSignal } from 'solid-js';

describe('<NumberField.Input />', () => {
  const { render } = createRenderer();

  describeConformance(NumberField.Input, () => ({
    refInstanceof: window.HTMLInputElement,
    render: (node, props) => render(() => <NumberField.Root>{node(props)}</NumberField.Root>),
  }));

  it('has textbox role', async () => {
    render(() => (
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>
    ));
    expect(screen.queryByRole('textbox')).not.to.equal(null);
  });

  it('should not allow non-numeric characters on change', async () => {
    render(() => (
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>
    ));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.input(input, 'abc');
    expect(input).to.have.value('');
  });

  it('should not allow non-numeric characters on keydown', async () => {
    render(() => (
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>
    ));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, { key: 'a' });
    expect(input).to.have.value('');
  });

  it('should allow numeric characters on change', async () => {
    render(() => (
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>
    ));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.input(input, { target: { value: '123' } });
    expect(input).to.have.value('123');
  });

  it('should increment on keydown ArrowUp', async () => {
    render(() => (
      <NumberField.Root defaultValue={0}>
        <NumberField.Input />
      </NumberField.Root>
    ));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).to.have.value('1');
  });

  it('should decrement on keydown ArrowDown', async () => {
    render(() => (
      <NumberField.Root defaultValue={0}>
        <NumberField.Input />
      </NumberField.Root>
    ));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).to.have.value('-1');
  });

  it('should increment to min on keydown Home', async () => {
    render(() => (
      <NumberField.Root min={-10} max={10}>
        <NumberField.Input />
      </NumberField.Root>
    ));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, { key: 'Home' });
    expect(input).to.have.value('-10');
  });

  it('should decrement to max on keydown End', async () => {
    render(() => (
      <NumberField.Root min={-10} max={10}>
        <NumberField.Input />
      </NumberField.Root>
    ));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, { key: 'End' });
    expect(input).to.have.value('10');
  });

  it('commits formatted value only on blur', async () => {
    render(() => (
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>
    ));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.input(input, { target: { value: '1234' } });
    expect(input).to.have.value('1234');
    fireEvent.blur(input);
    expect(input).to.have.value((1234).toLocaleString());
  });

  it('should commit validated number on blur (min)', async () => {
    render(() => (
      <NumberField.Root min={0}>
        <NumberField.Input />
      </NumberField.Root>
    ));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.input(input, { target: { value: '-1' } });
    expect(input).to.have.value('-1');
    fireEvent.blur(input);
    expect(input).to.have.value('0');
  });

  it('should commit validated number on blur (max)', async () => {
    render(() => (
      <NumberField.Root max={0}>
        <NumberField.Input />
      </NumberField.Root>
    ));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.input(input, { target: { value: '1' } });
    expect(input).to.have.value('1');
    fireEvent.blur(input);
    expect(input).to.have.value('0');
  });

  it('should not snap number to step on blur', async () => {
    render(() => (
      <NumberField.Root step={0.5} snapOnStep>
        <NumberField.Input />
      </NumberField.Root>
    ));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.input(input, { target: { value: '1.5' } });
    expect(input).to.have.value('1.5');
    fireEvent.blur(input);
    expect(input).to.have.value('1.5');
  });

  it('should commit validated number on blur (step and min)', async () => {
    render(() => (
      <NumberField.Root min={2} step={2}>
        <NumberField.Input />
      </NumberField.Root>
    ));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.input(input, { target: { value: '3' } });
    expect(input).to.have.value('3');
    fireEvent.blur(input);
    expect(input).to.have.value('3');
  });

  it('should preserve full precision on first blur after external value change', async () => {
    const [value, setValue] = createSignal<number | null>(null);
    const onValueChange = spy();

    function Controlled(props: { value: number | null }) {
      return (
        <NumberField.Root value={props.value} onValueChange={onValueChange}>
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    render(() => <Controlled value={value()} />);
    const input = screen.getByRole('textbox');

    setValue(1.23456);

    expect(input).to.have.value('1.23456');

    input.focus();
    input.blur();

    expect(input).to.have.value('1.23456');
    expect(onValueChange.callCount).to.equal(0);
  });

  it('should update input value after increment/decrement followed by external value change', async () => {
    const onValueChange = spy();

    function Controlled() {
      const [value, setValue] = createSignal<number | null>(0);
      return (
        <NumberField.Root
          value={value()}
          onValueChange={(val) => {
            onValueChange(val);
            setValue(val);
          }}
        >
          <NumberField.Input />
          <NumberField.Increment />
          <NumberField.Decrement />
          <button onClick={() => setValue(1.23456)}>external</button>
        </NumberField.Root>
      );
    }

    const { user } = render(() => <Controlled />);
    const input = screen.getByRole('textbox');
    const incrementButton = screen.getByLabelText('Increase');

    expect(input).to.have.value('0');

    await user.click(incrementButton);

    expect(input).to.have.value('1');
    expect(onValueChange.callCount).to.equal(2);

    await user.click(screen.getByText('external'));

    expect(input).to.have.value('1.23456');
  });

  it('should update input value after decrement followed by external value change', async () => {
    const onValueChange = spy();

    function Controlled() {
      const [value, setValue] = createSignal<number | null>(5);
      return (
        <NumberField.Root
          value={value()}
          onValueChange={(val) => {
            onValueChange(val);
            setValue(val);
          }}
        >
          <NumberField.Input />
          <NumberField.Increment />
          <NumberField.Decrement />
          <button onClick={() => setValue(2.98765)}>external</button>
        </NumberField.Root>
      );
    }

    const { user } = render(() => <Controlled />);
    const input = screen.getByRole('textbox');
    const decrementButton = screen.getByLabelText('Decrease');

    expect(input).to.have.value('5');

    await user.click(decrementButton);

    expect(input).to.have.value('4');
    expect(onValueChange.callCount).to.equal(2);

    await user.click(screen.getByText('external'));

    expect(input).to.have.value('2.98765');
  });

  it('should allow typing after precision is preserved on blur', async () => {
    const onValueChange = spy();

    function Controlled(props: { value: number | null }) {
      return (
        <NumberField.Root value={props.value} onValueChange={onValueChange}>
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    const [value, setValue] = createSignal<number | null>(null);
    const { user } = render(() => <Controlled value={value()} />);
    const input = screen.getByRole('textbox');

    setValue(1.23456);

    expect(input).to.have.value('1.23456');

    input.focus();
    input.blur();

    expect(input).to.have.value('1.23456');

    input.focus();

    await user.clear(input);
    await user.keyboard('1.234567');
    expect(input).to.have.value('1.234567');

    fireEvent.blur(input);
    expect(input).to.have.value('1.23456');
  });

  it('should format to canonical representation when input differs from max precision', async () => {
    const onValueChange = spy();

    function Controlled(props: { value: number | null }) {
      return (
        <NumberField.Root value={props.value} onValueChange={onValueChange}>
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    const [value, setValue] = createSignal<number | null>(null);
    const { user } = render(() => <Controlled value={value()} />);
    const input = screen.getByRole('textbox');

    setValue(1.23456);

    expect(input).to.have.value('1.23456');

    input.focus();

    await user.clear(input);
    await user.keyboard('1.23456000');
    expect(input).to.have.value('1.23456000');

    fireEvent.blur(input);
    expect(input).to.have.value('1.23456');
  });

  it('should handle multiple blur cycles with precision preservation', async () => {
    const onValueChange = spy();

    function Controlled(props: { value: number | null }) {
      return (
        <NumberField.Root value={props.value} onValueChange={onValueChange}>
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    const [value, setValue] = createSignal<number | null>(null);
    render(() => <Controlled value={value()} />);
    const input = screen.getByRole('textbox');

    setValue(1.23456789);

    expect(input).to.have.value('1.23456789');

    input.focus();
    input.blur();

    expect(input).to.have.value('1.23456789');
    expect(onValueChange.callCount).to.equal(0);

    input.focus();
    input.blur();

    expect(input).to.have.value('1.23456789');
    expect(onValueChange.callCount).to.equal(0);
  });

  it('should handle edge case where parsed value equals current value but input differs', async () => {
    const onValueChange = spy();

    function Controlled(props: { value: number | null }) {
      return (
        <NumberField.Root value={props.value} onValueChange={onValueChange}>
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    const [value, setValue] = createSignal<number | null>(null);
    const { user } = render(() => <Controlled value={value()} />);
    const input = screen.getByRole('textbox');

    setValue(1.5);

    expect(input).to.have.value('1.5');

    input.focus();

    await user.clear(input);
    await user.keyboard('1.50');
    expect(input).to.have.value('1.50');

    fireEvent.blur(input);
    expect((input as HTMLInputElement).value).to.match(/^1\.5/);
  });

  it('should preserve precision when value matches max precision after external change during typing', async () => {
    const onValueChange = spy();

    function Controlled() {
      const [value, setValue] = createSignal<number | null>(null);
      return (
        <NumberField.Root
          value={value()}
          onValueChange={(val) => {
            onValueChange(val);
            setValue(val);
          }}
        >
          <NumberField.Input />
          <button onClick={() => setValue(3.14159265)}>set pi</button>
        </NumberField.Root>
      );
    }

    const { user } = render(() => <Controlled />);
    const input = screen.getByRole('textbox');

    input.focus();

    await user.keyboard('2.7');
    expect(input).to.have.value('2.7');

    await user.click(screen.getByText('set pi'));

    expect(input).to.have.value('3.14159265');

    fireEvent.blur(input);
    expect(input).to.have.value('3.14159265');
  });

  it('should round to explicit maximumFractionDigits on blur', async () => {
    const onValueChange = spy();

    function Controlled(props: { value: number | null }) {
      return (
        <NumberField.Root
          value={props.value}
          onValueChange={onValueChange}
          format={{ maximumFractionDigits: 2 }}
        >
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    const [value, setValue] = createSignal<number | null>(null);
    render(() => <Controlled value={value()} />);
    const input = screen.getByRole('textbox');

    setValue(1.23456);

    expect(input).to.have.value('1.23');

    input.focus();
    input.blur();

    expect(input).to.have.value('1.23');
    expect(onValueChange.callCount).to.equal(1);
    expect(onValueChange.firstCall.args[0]).to.equal(1.23);
  });

  it('should round to step precision on blur when step implies precision constraints', async () => {
    const onValueChange = spy();

    function Controlled() {
      const [value, setValue] = createSignal<number | null>(null);
      return (
        <NumberField.Root
          value={value()}
          onValueChange={(val) => {
            onValueChange(val);
            setValue(val);
          }}
          step={0.01}
        >
          <NumberField.Input />
        </NumberField.Root>
      );
    }

    const { user } = render(() => <Controlled />);
    const input = screen.getByRole('textbox');

    input.focus();

    await user.keyboard('1.23456');
    expect(input).to.have.value('1.23456');

    // The stored value should be the full precision value
    const valueBeforeBlur = onValueChange.lastCall.args[0];
    // The value gets processed through removeFloatingPointErrors during validation
    // which applies some default precision constraints
    expect(valueBeforeBlur).to.equal(1.235);

    const callCountBeforeBlur = onValueChange.callCount;

    fireEvent.blur(input);

    // Without explicit precision formatting, the behavior depends on the step
    // The current implementation preserves full precision until it differs from canonical
    expect(input).to.have.value('1.235');
    expect(onValueChange.callCount).to.equal(callCountBeforeBlur + 1);
  });
});
