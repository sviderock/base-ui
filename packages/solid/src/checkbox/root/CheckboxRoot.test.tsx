/* eslint-disable testing-library/no-container */
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Checkbox } from '@base-ui-components/solid/checkbox';
import { CheckboxGroup } from '@base-ui-components/solid/checkbox-group';
import { Field } from '@base-ui-components/solid/field';
import { Form } from '@base-ui-components/solid/form';
import { fireEvent, screen, waitFor } from '@solidjs/testing-library';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createSignal } from 'solid-js';

describe('<Checkbox.Root />', () => {
  const { render } = createRenderer();

  describeConformance(Checkbox.Root, () => ({
    refInstanceof: window.HTMLButtonElement,
    render,
  }));

  describe('ARIA attributes', () => {
    it('sets the correct aria attributes', async () => {
      const [required, setRequired] = createSignal(false);
      render(() => <Checkbox.Root data-testid="test" required={required()} />);

      expect(screen.getByRole('checkbox')).to.equal(screen.getByTestId('test'));
      expect(screen.getByRole('checkbox')).to.have.attribute('aria-checked');
      setRequired(true);
      expect(screen.getByRole('checkbox')).to.have.attribute('aria-required', 'true');
    });
  });

  describe('extra props', () => {
    it('can override the built-in attributes', async () => {
      render(() => <Checkbox.Root role="switch" />);
      expect(screen.getByRole('switch')).to.have.attribute('role', 'switch');
    });
  });

  it('should change its state when clicked', async () => {
    const { container } = render(() => <Checkbox.Root />);
    const [checkbox] = screen.getAllByRole('checkbox');
    const input = container.querySelector('input[type=checkbox]') as HTMLInputElement;

    expect(checkbox).to.have.attribute('aria-checked', 'false');
    expect(input.checked).to.equal(false);

    checkbox.click();

    expect(checkbox).to.have.attribute('aria-checked', 'true');
    expect(input.checked).to.equal(true);

    checkbox.click();

    expect(checkbox).to.have.attribute('aria-checked', 'false');
    expect(input.checked).to.equal(false);
  });

  it('should update its state when changed from outside', async () => {
    function Test() {
      const [checked, setChecked] = createSignal(false);
      return (
        <div>
          <button onClick={() => setChecked((c) => !c)}>Toggle</button>
          <Checkbox.Root checked={checked()} />;
        </div>
      );
    }

    render(() => <Test />);
    const [checkbox] = screen.getAllByRole('checkbox');
    const button = screen.getByText('Toggle');

    expect(checkbox).to.have.attribute('aria-checked', 'false');
    button.click();

    expect(checkbox).to.have.attribute('aria-checked', 'true');

    button.click();

    expect(checkbox).to.have.attribute('aria-checked', 'false');
  });

  it('should call onChange when clicked', async () => {
    const handleChange = spy();
    render(() => <Checkbox.Root onCheckedChange={handleChange} />);
    const [checkbox] = screen.getAllByRole('checkbox');

    checkbox.click();

    expect(handleChange.callCount).to.equal(1);
    expect(handleChange.firstCall.args[0]).to.equal(true);
  });

  describe('prop: disabled', () => {
    it('should have the `disabled` attribute', async () => {
      render(() => <Checkbox.Root disabled />);
      expect(screen.getAllByRole('checkbox')[0]).to.have.attribute('disabled');
    });

    it('should not have the `disabled` attribute when `disabled` is not set', async () => {
      render(() => <Checkbox.Root />);
      expect(screen.getAllByRole('checkbox')[0]).not.to.have.attribute('disabled');
    });

    it('should not change its state when clicked', async () => {
      render(() => <Checkbox.Root disabled />);
      const [checkbox] = screen.getAllByRole('checkbox');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      checkbox.click();

      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: readOnly', () => {
    it('should have the `aria-readonly` attribute', async () => {
      render(() => <Checkbox.Root readOnly />);
      expect(screen.getAllByRole('checkbox')[0]).to.have.attribute('aria-readonly', 'true');
    });

    it('should not have the aria attribute when `readOnly` is not set', async () => {
      render(() => <Checkbox.Root />);
      expect(screen.getAllByRole('checkbox')[0]).not.to.have.attribute('aria-readonly');
    });

    it('should not change its state when clicked', async () => {
      render(() => <Checkbox.Root readOnly />);
      const [checkbox] = screen.getAllByRole('checkbox');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      checkbox.click();

      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: indeterminate', () => {
    it('should set the `aria-checked` attribute as "mixed"', async () => {
      render(() => <Checkbox.Root indeterminate />);
      expect(screen.getAllByRole('checkbox')[0]).to.have.attribute('aria-checked', 'mixed');
    });

    it('should not change its state when clicked', async () => {
      render(() => <Checkbox.Root indeterminate />);
      const [checkbox] = screen.getAllByRole('checkbox');

      expect(checkbox).to.have.attribute('aria-checked', 'mixed');

      checkbox.click();

      expect(checkbox).to.have.attribute('aria-checked', 'mixed');
    });

    it('should not have the aria attribute when `indeterminate` is not set', async () => {
      render(() => <Checkbox.Root />);
      expect(screen.getAllByRole('checkbox')[0]).not.to.have.attribute('aria-checked', 'mixed');
    });

    it('should not be overridden by `checked` prop', async () => {
      render(() => <Checkbox.Root indeterminate checked />);
      expect(screen.getAllByRole('checkbox')[0]).to.have.attribute('aria-checked', 'mixed');
    });
  });

  it('should update its state if the underlying input is toggled', async () => {
    const { container } = render(() => <Checkbox.Root />);
    const [checkbox] = screen.getAllByRole('checkbox');
    const input = container.querySelector('input[type=checkbox]') as HTMLInputElement;

    input.click();

    expect(checkbox).to.have.attribute('aria-checked', 'true');
  });

  it('should place the style hooks on the root and the indicator', async () => {
    const [disabled, setDisabled] = createSignal(true);
    const [readOnly, setReadOnly] = createSignal(true);
    render(() => (
      <Checkbox.Root defaultChecked disabled={disabled()} readOnly={readOnly()} required>
        <Checkbox.Indicator />
      </Checkbox.Root>
    ));

    const [checkbox] = screen.getAllByRole('checkbox');
    const indicator = checkbox.querySelector('span');

    expect(checkbox).to.have.attribute('data-checked', '');
    expect(checkbox).not.to.have.attribute('data-unchecked');

    expect(checkbox).to.have.attribute('data-disabled', '');
    expect(checkbox).to.have.attribute('data-readonly', '');
    expect(checkbox).to.have.attribute('data-required', '');

    expect(indicator).to.have.attribute('data-checked', '');
    expect(indicator).not.to.have.attribute('data-unchecked');

    expect(indicator).to.have.attribute('data-disabled', '');
    expect(indicator).to.have.attribute('data-readonly', '');
    expect(indicator).to.have.attribute('data-required', '');

    setDisabled(false);
    setReadOnly(false);

    fireEvent.click(checkbox);

    expect(checkbox).to.have.attribute('data-unchecked', '');
    expect(checkbox).not.to.have.attribute('data-checked');
  });

  it('should set the name attribute on the input', async () => {
    const { container } = render(() => <Checkbox.Root name="checkbox-name" />);
    const input = container.querySelector('input[type="checkbox"]')! as HTMLInputElement;

    expect(input).to.have.attribute('name', 'checkbox-name');
  });

  describe('Form', () => {
    it('should toggle the checkbox when a parent label is clicked', async () => {
      render(() => (
        <label data-testid="label">
          <Checkbox.Root />
          Toggle
        </label>
      ));

      const [checkbox] = screen.getAllByRole('checkbox');
      const label = screen.getByTestId('label');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      label.click();

      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });

    it('should toggle the checkbox when a linked label is clicked', async () => {
      render(() => (
        <div>
          <label for="test-checkbox" data-testid="label">
            Toggle
          </label>
          <Checkbox.Root id="test-checkbox" />
        </div>
      ));

      const [checkbox] = screen.getAllByRole('checkbox');
      const label = screen.getByTestId('label');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      label.click();

      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });

    it('triggers native HTML validation on submit', async () => {
      const { user } = render(() => (
        <Form>
          <Field.Root name="test" data-testid="field">
            <Checkbox.Root required />
            <Field.Error match="valueMissing" data-testid="error">
              required
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>
      ));

      const submit = screen.getByText('Submit');

      expect(screen.queryByTestId('error')).to.equal(null);

      await user.click(submit);

      const error = screen.getByTestId('error');
      expect(error).to.have.text('required');
    });

    it('clears errors on change', async () => {
      function App() {
        const [errors, setErrors] = createSignal<Record<string, string | string[]>>({
          test: 'test',
        });
        return (
          <Form errors={errors} onClearErrors={setErrors}>
            <Field.Root name="test" data-testid="field">
              <Checkbox.Root data-testid="checkbox" />
              <Field.Error data-testid="error" />
            </Field.Root>
          </Form>
        );
      }

      render(() => <App />);

      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).to.have.attribute('aria-invalid', 'true');
      expect(screen.queryByTestId('error')).to.have.text('test');

      fireEvent.click(checkbox);

      expect(checkbox).not.to.have.attribute('aria-invalid');
      expect(screen.queryByTestId('error')).to.equal(null);
    });

    it('should include the checkbox value in the form submission', async ({ skip }) => {
      if (isJSDOM) {
        // FormData is not available in JSDOM
        skip();
      }

      let stringifiedFormData = '';

      render(() => (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            stringifiedFormData = new URLSearchParams(formData as any).toString();
          }}
        >
          <Checkbox.Root name="test-checkbox" />
          <button type="submit">Submit</button>
        </form>
      ));

      const [checkbox] = screen.getAllByRole('checkbox');
      const submitButton = screen.getByRole('button')!;

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-checkbox=off');

      checkbox.click();

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-checkbox=on');
    });

    it('should include the custom checkbox value in the form submission', async ({ skip }) => {
      if (isJSDOM) {
        // FormData is not available in JSDOM
        skip();
      }

      let stringifiedFormData = '';

      render(() => (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            stringifiedFormData = new URLSearchParams(formData as any).toString();
          }}
        >
          <Checkbox.Root name="test-checkbox" value="test-value" />
          <button type="submit">Submit</button>
        </form>
      ));

      const [checkbox] = screen.getAllByRole('checkbox');
      const submitButton = screen.getByRole('button')!;

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-checkbox=off');

      checkbox.click();

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-checkbox=test-value');
    });
  });

  describe('Field', () => {
    it('should receive disabled prop from Field.Root', async () => {
      render(() => (
        <Field.Root disabled>
          <Checkbox.Root />
        </Field.Root>
      ));

      const [checkbox] = screen.getAllByRole('checkbox');
      expect(checkbox).to.have.attribute('disabled');
    });

    it('should receive name prop from Field.Root', async () => {
      const { container } = render(() => (
        <Field.Root name="field-checkbox">
          <Checkbox.Root />
        </Field.Root>
      ));

      const input = container.querySelector('input[type="checkbox"]');
      expect(input).to.have.attribute('name', 'field-checkbox');
    });

    it('[data-touched]', async () => {
      render(() => (
        <Field.Root>
          <Checkbox.Root data-testid="button" />
        </Field.Root>
      ));

      const button = screen.getByTestId('button');

      fireEvent.focus(button);
      fireEvent.blur(button);

      expect(button).to.have.attribute('data-touched', '');
    });

    it('[data-dirty]', async () => {
      render(() => (
        <Field.Root>
          <Checkbox.Root data-testid="button" />
        </Field.Root>
      ));

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('data-dirty');

      fireEvent.click(button);

      expect(button).to.have.attribute('data-dirty', '');
    });

    describe('[data-filled]', () => {
      it('adds [data-filled] attribute when checked after being initially unchecked', async () => {
        render(() => (
          <Field.Root>
            <Checkbox.Root data-testid="button" />
          </Field.Root>
        ));

        const button = screen.getByTestId('button');

        expect(button).not.to.have.attribute('data-filled');

        fireEvent.click(button);

        expect(button).to.have.attribute('data-filled', '');

        fireEvent.click(button);

        expect(button).not.to.have.attribute('data-filled');
      });

      it('removes [data-filled] attribute when unchecked after being initially checked', async () => {
        render(() => (
          <Field.Root>
            <Checkbox.Root data-testid="button" defaultChecked />
          </Field.Root>
        ));

        const button = screen.getByTestId('button');

        expect(button).to.have.attribute('data-filled');

        fireEvent.click(button);

        expect(button).not.to.have.attribute('data-filled', '');
      });

      it('adds [data-filled] attribute when any checkbox is filled when inside a group', async () => {
        render(() => (
          <Field.Root>
            <CheckboxGroup defaultValue={['1', '2']}>
              <Checkbox.Root name="1" data-testid="button-1" />
              <Checkbox.Root name="2" data-testid="button-2" />
            </CheckboxGroup>
          </Field.Root>
        ));

        const button1 = screen.getByTestId('button-1');
        const button2 = screen.getByTestId('button-2');

        expect(button1).to.have.attribute('data-filled');
        expect(button2).to.have.attribute('data-filled');

        fireEvent.click(button1);

        expect(button1).to.have.attribute('data-filled');
        expect(button2).to.have.attribute('data-filled');

        fireEvent.click(button2);

        expect(button1).not.to.have.attribute('data-filled');
        expect(button2).not.to.have.attribute('data-filled');
      });
    });

    it('[data-focused]', async () => {
      render(() => (
        <Field.Root>
          <Checkbox.Root data-testid="button" />
        </Field.Root>
      ));

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('data-focused');

      fireEvent.focus(button);

      expect(button).to.have.attribute('data-focused', '');

      fireEvent.blur(button);

      expect(button).not.to.have.attribute('data-focused');
    });

    it('prop: validate', async () => {
      render(() => (
        <Field.Root validate={() => 'error'}>
          <Checkbox.Root data-testid="button" />
          <Field.Error data-testid="error" />
        </Field.Root>
      ));

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('aria-invalid');

      fireEvent.focus(button);
      fireEvent.blur(button);

      expect(button).to.have.attribute('aria-invalid', 'true');
    });

    it('props: validationMode=onChange', async () => {
      render(() => (
        <Field.Root
          validationMode="onChange"
          validate={(value) => {
            const checked = value as boolean;
            return checked ? 'error' : null;
          }}
        >
          <Checkbox.Root data-testid="button" />
        </Field.Root>
      ));

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('aria-invalid');

      fireEvent.click(button);

      expect(button).to.have.attribute('aria-invalid', 'true');
    });

    it('prop: validationMode=onBlur', async () => {
      render(() => (
        <Field.Root
          validationMode="onBlur"
          validate={(value) => {
            const checked = value as boolean;
            return checked ? 'error' : null;
          }}
        >
          <Checkbox.Root data-testid="button" />
          <Field.Error data-testid="error" />
        </Field.Root>
      ));

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('aria-invalid');

      fireEvent.click(button);
      fireEvent.blur(button);

      expect(button).to.have.attribute('aria-invalid', 'true');
    });

    describe('Field.Label', () => {
      it('explicit association', async () => {
        render(() => (
          <Field.Root>
            <Field.Label>Label</Field.Label>
            <Checkbox.Root data-testid="button" />
          </Field.Root>
        ));

        const label = screen.getByText('Label');
        const button = screen.getByTestId('button');

        await waitFor(() => {
          expect(label.getAttribute('for')).to.not.equal(null);
        });

        expect(label.getAttribute('for')).to.equal(button.getAttribute('id'));

        expect(button.getAttribute('aria-labelledby')).to.equal(label.getAttribute('id'));
        expect(button).to.have.attribute('aria-checked', 'false');

        fireEvent.click(label);
        expect(button).to.have.attribute('aria-checked', 'true');
      });

      it('implicit association', async () => {
        render(() => (
          <Field.Root>
            <Field.Label data-testid="label">
              <Checkbox.Root data-testid="button" />
            </Field.Label>
          </Field.Root>
        ));

        const label = screen.getByTestId('label');
        expect(label).to.not.have.attribute('for');

        const button = screen.getByTestId('button');
        expect(button).to.have.attribute('aria-checked', 'false');

        fireEvent.click(label);
        expect(button).to.have.attribute('aria-checked', 'true');
      });
    });

    it('Field.Description', async () => {
      const { container } = render(() => (
        <Field.Root>
          <Checkbox.Root data-testid="button" />
          <Field.Description data-testid="description" />
        </Field.Root>
      ));

      const internalInput = container.querySelector<HTMLInputElement>('input[type="checkbox"]');

      expect(internalInput).to.have.attribute(
        'aria-describedby',
        screen.getByTestId('description').id,
      );
    });
  });

  it('should change state when clicking the checkbox if it has a wrapping label', async () => {
    render(() => (
      <label data-testid="label">
        <Checkbox.Root />
        Toggle
      </label>
    ));

    const [checkbox] = screen.getAllByRole('checkbox');

    expect(checkbox).to.have.attribute('aria-checked', 'false');

    fireEvent.click(checkbox);

    expect(checkbox).to.have.attribute('aria-checked', 'true');

    fireEvent.click(checkbox);

    expect(checkbox).to.have.attribute('aria-checked', 'false');
  });
});
