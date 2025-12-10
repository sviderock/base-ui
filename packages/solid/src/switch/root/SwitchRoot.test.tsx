import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Field } from '@base-ui-components/solid/field';
import { Form } from '@base-ui-components/solid/form';
import { Switch } from '@base-ui-components/solid/switch';
import { fireEvent, screen, waitFor } from '@solidjs/testing-library';
import { userEvent } from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js';

describe('<Switch.Root />', () => {
  const { render } = createRenderer();

  describeConformance(Switch.Root, () => ({
    refInstanceof: window.HTMLButtonElement,
    render,
  }));

  describe('interaction', () => {
    it('should change its state when clicked', async () => {
      render(() => <Switch.Root />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      switchElement.click();

      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });

    it('should update its state when changed from outside', async () => {
      function Test() {
        const [checked, setChecked] = createSignal(false);
        return (
          <div>
            <button onClick={() => setChecked((c) => !c)}>Toggle</button>
            <Switch.Root checked={checked()} />;
          </div>
        );
      }

      render(() => <Test />);
      const switchElement = screen.getByRole('switch');
      const button = screen.getByText('Toggle');

      expect(switchElement).to.have.attribute('aria-checked', 'false');
      button.click();

      expect(switchElement).to.have.attribute('aria-checked', 'true');

      button.click();

      expect(switchElement).to.have.attribute('aria-checked', 'false');
    });

    it('should update its state if the underlying input is toggled', async () => {
      render(() => <Switch.Root />);
      const switchElement = screen.getByRole('switch');
      const internalInput = screen.getByRole('checkbox', { hidden: true });

      internalInput.click();

      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });
  });

  describe('extra props', () => {
    it('should override the built-in attributes', async () => {
      render(() => <Switch.Root role="checkbox" data-testid="switch" />);
      expect(screen.getByTestId('switch')).to.have.attribute('role', 'checkbox');
    });
  });

  describe('prop: onChange', () => {
    it('should call onChange when clicked', async () => {
      const handleChange = spy();
      render(() => <Switch.Root onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      switchElement.click();

      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[0]).to.equal(true);
    });
  });

  describe('prop: onClick', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = spy();
      render(() => <Switch.Root onClick={handleClick} />);
      const switchElement = screen.getByRole('switch');

      switchElement.click();

      expect(handleClick.callCount).to.equal(1);
    });
  });

  describe('prop: disabled', () => {
    it('should have the `disabled` attribute', async () => {
      render(() => <Switch.Root disabled />);
      expect(screen.getByRole('switch')).to.have.attribute('disabled');
    });

    it('should not have the `disabled` attribute when `disabled` is not set', async () => {
      render(() => <Switch.Root />);
      expect(screen.getByRole('switch')).not.to.have.attribute('disabled');
    });

    it('should not change its state when clicked', async () => {
      render(() => <Switch.Root disabled />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      switchElement.click();

      expect(switchElement).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: readOnly', () => {
    it('should have the `aria-readonly` attribute', async () => {
      render(() => <Switch.Root readOnly />);
      expect(screen.getByRole('switch')).to.have.attribute('aria-readonly', 'true');
    });

    it('should not have the aria attribute when `readOnly` is not set', async () => {
      render(() => <Switch.Root />);
      expect(screen.getByRole('switch')).not.to.have.attribute('aria-readonly');
    });

    it('should not change its state when clicked', async () => {
      render(() => <Switch.Root readOnly />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      switchElement.click();

      expect(switchElement).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: inputRef', () => {
    it('should be able to access the native input', async () => {
      let refs = { inputRef: null };
      render(() => <Switch.Root refs={refs} />);
      const internalInput = screen.getByRole('checkbox', { hidden: true });

      expect(refs.inputRef).to.equal(internalInput);
    });
  });

  it('should place the style hooks on the root and the thumb', async () => {
    const [disabled, setDisabled] = createSignal(true);
    const [readOnly, setReadOnly] = createSignal(true);
    render(() => (
      <Switch.Root defaultChecked disabled={disabled} readOnly={readOnly} required>
        <Switch.Thumb data-testid="thumb" />
      </Switch.Root>
    ));

    const switchElement = screen.getByRole('switch');
    const thumb = screen.getByTestId('thumb');

    expect(switchElement).to.have.attribute('data-checked', '');
    expect(switchElement).to.have.attribute('data-disabled', '');
    expect(switchElement).to.have.attribute('data-readonly', '');
    expect(switchElement).to.have.attribute('data-required', '');

    expect(thumb).to.have.attribute('data-checked', '');
    expect(thumb).to.have.attribute('data-disabled', '');
    expect(thumb).to.have.attribute('data-readonly', '');
    expect(thumb).to.have.attribute('data-required', '');

    setDisabled(false);
    setReadOnly(false);
    fireEvent.click(switchElement);

    expect(switchElement).to.have.attribute('data-unchecked', '');
    expect(switchElement).not.to.have.attribute('data-checked');

    expect(thumb).to.have.attribute('data-unchecked', '');
    expect(thumb).not.to.have.attribute('data-checked');
  });

  it('should set the name attribute on the input', async () => {
    render(() => <Switch.Root name="switch-name" />);
    const input = screen.getByRole('checkbox', { hidden: true });

    expect(input).to.have.attribute('name', 'switch-name');
  });

  describe('Form', () => {
    const user = userEvent.setup();

    it('should toggle the switch when a parent label is clicked', async () => {
      render(() => (
        <label data-testid="label">
          <Switch.Root />
          Toggle
        </label>
      ));

      const switchElement = screen.getByRole('switch');
      const label = screen.getByTestId('label');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      await user.click(label);

      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });

    it('should toggle the switch when a linked label is clicked', async () => {
      render(() => (
        <div>
          <label for="test-switch" data-testid="label">
            Toggle
          </label>
          <Switch.Root id="test-switch" />
        </div>
      ));

      const switchElement = screen.getByRole('switch');
      const label = screen.getByTestId('label');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      await user.click(label);

      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });

    it('should include the switch value in the form submission', async ({ skip }) => {
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
          <Switch.Root name="test-switch" />
          <button type="submit">Submit</button>
        </form>
      ));

      const switchElement = screen.getByRole('switch');
      const submitButton = screen.getByRole('button')!;

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-switch=off');

      switchElement.click();

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-switch=on');
    });

    it('triggers native HTML validation on submit', async () => {
      render(() => (
        <Form>
          <Field.Root name="test" data-testid="field">
            <Switch.Root name="switch" required />
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
          <Form errors={errors()} onClearErrors={setErrors}>
            <Field.Root name="test" data-testid="field">
              <Switch.Root data-testid="switch" />
              <Field.Error data-testid="error" />
            </Field.Root>
          </Form>
        );
      }

      render(() => <App />);

      const switchElement = screen.getByTestId('switch');

      expect(switchElement).to.have.attribute('aria-invalid', 'true');
      expect(screen.queryByTestId('error')).to.have.text('test');

      fireEvent.click(switchElement);

      expect(switchElement).not.to.have.attribute('aria-invalid');
      expect(screen.queryByTestId('error')).to.equal(null);
    });
  });

  describe('Field', () => {
    it('should receive disabled prop from Field.Root', async () => {
      render(() => (
        <Field.Root disabled>
          <Switch.Root />
        </Field.Root>
      ));

      const switchElement = screen.getByRole('switch');
      expect(switchElement).to.have.attribute('disabled');
    });

    it('should receive name prop from Field.Root', async () => {
      render(() => (
        <Field.Root name="field-switch">
          <Switch.Root />
        </Field.Root>
      ));

      const input = screen.getByRole('checkbox', { hidden: true });
      expect(input).to.have.attribute('name', 'field-switch');
    });

    it('[data-touched]', async () => {
      render(() => (
        <Field.Root>
          <Switch.Root data-testid="button" />
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
          <Switch.Root data-testid="button" />
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
            <Switch.Root data-testid="button" />
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
            <Switch.Root data-testid="button" defaultChecked />
          </Field.Root>
        ));

        const button = screen.getByTestId('button');

        expect(button).to.have.attribute('data-filled');

        fireEvent.click(button);

        expect(button).not.to.have.attribute('data-filled', '');
      });
    });

    it('[data-focused]', async () => {
      render(() => (
        <Field.Root>
          <Switch.Root data-testid="button" />
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
          <Switch.Root data-testid="button" />
          <Field.Error data-testid="error" />
        </Field.Root>
      ));

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('aria-invalid');

      fireEvent.focus(button);
      fireEvent.blur(button);

      expect(button).to.have.attribute('aria-invalid', 'true');
    });

    it('prop: validationMode=onChange', async () => {
      render(() => (
        <Field.Root
          validationMode="onChange"
          validate={(value) => {
            const checked = value as boolean;
            return checked ? 'error' : null;
          }}
        >
          <Switch.Root data-testid="button" />
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
          <Switch.Root data-testid="button" />
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
      describe('implicit', () => {
        it('when rendering a native button', async () => {
          render(() => (
            <Field.Root>
              <Field.Label data-testid="label">
                <Switch.Root data-testid="button" />
              </Field.Label>
            </Field.Root>
          ));

          console.log(1);
          screen.debug();
          const label = screen.getByTestId('label');
          expect(label).to.not.have.attribute('for');
          console.log(2);

          const button = screen.getByRole('switch');
          expect(button).to.have.attribute('aria-checked', 'false');
          console.log(3);

          fireEvent.click(label);
          console.log(4);
          expect(button).to.have.attribute('aria-checked', 'true');
        });

        it('when rendering a non-native button', async () => {
          render(() => (
            <Field.Root>
              <Field.Label data-testid="label">
                <Switch.Root
                  data-testid="button"
                  render={(p) => <span {...(p() as any)} />}
                  nativeButton={false}
                />
              </Field.Label>
            </Field.Root>
          ));

          const label = screen.getByTestId('label');
          const button = screen.getByRole('switch');

          expect(button.getAttribute('aria-labelledby')).to.equal(label.getAttribute('id'));
        });
      });

      describe('explicit association', () => {
        it('when the label is sibling to the switch', async () => {
          render(() => (
            <Field.Root>
              <Field.Label data-testid="label">Label</Field.Label>
              <Switch.Root data-testid="button" />
            </Field.Root>
          ));

          const label = screen.getByTestId('label');
          const button = screen.getByRole('switch');

          await waitFor(() => {
            expect(label.getAttribute('for')).to.not.equal(null);
          });

          expect(label.getAttribute('for')).to.equal(button.getAttribute('id'));
          expect(button.getAttribute('aria-labelledby')).to.equal(label.getAttribute('id'));

          expect(button).to.have.attribute('aria-checked', 'false');

          fireEvent.click(label);
          expect(button).to.have.attribute('aria-checked', 'true');
        });

        it('when rendering a non-native label', async () => {
          render(() => (
            <Field.Root>
              <Field.Label data-testid="label" render="span">
                <Switch.Root data-testid="button" />
              </Field.Label>
            </Field.Root>
          ));

          screen.debug();
          console.log(1);
          const label = screen.getByTestId('label');
          const button = screen.getByRole('switch');
          console.log(2);

          expect(label.getAttribute('for')).to.not.equal(null);
          expect(button.getAttribute('aria-labelledby')).to.not.equal(null);

          console.log(3);
          expect(label.getAttribute('for')).to.equal(button.getAttribute('id'));
          expect(button.getAttribute('aria-labelledby')).to.equal(label.getAttribute('id'));

          console.log(4);
          expect(button).to.have.attribute('aria-checked', 'false');

          console.log(5);
          fireEvent.click(label);
          console.log(6);
          expect(button).to.have.attribute('aria-checked', 'false');
        });
      });
    });

    it('Field.Description', async () => {
      const { container } = render(() => (
        <Field.Root>
          <Switch.Root data-testid="button" />
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
});
