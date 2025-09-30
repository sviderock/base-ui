import { createRenderer, describeConformance } from '#test-utils';
import { Field } from '@base-ui-components/solid/field';
import { fireEvent, screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Field.Error />', () => {
  const { render } = createRenderer();

  describeConformance(
    (props) => <Field.Error match {...props} />,
    () => ({
      refInstanceof: window.HTMLDivElement,
      render(node, elementProps = {}) {
        return render(
          () => (
            <Field.Root invalid>
              <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
            </Field.Root>
          ),
          elementProps,
        );
      },
    }),
  );

  it('should set aria-describedby on the control automatically', async () => {
    render(() => (
      <Field.Root invalid>
        <Field.Control />
        <Field.Error match>Message</Field.Error>
      </Field.Root>
    ));

    expect(screen.getByRole('textbox')).to.have.attribute(
      'aria-describedby',
      screen.getByText('Message').id,
    );
  });

  it('should show error messages by default', async () => {
    render(() => (
      <Field.Root>
        <Field.Control required />
        <Field.Error>Message</Field.Error>
      </Field.Root>
    ));

    expect(screen.queryByText('Message')).to.equal(null);

    const input = screen.getByRole<HTMLInputElement>('textbox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(screen.queryByText('Message')).not.to.equal(null);
  });

  describe('prop: match', () => {
    it('should only render when `match` matches constraint validation', async () => {
      render(() => (
        <Field.Root>
          <Field.Control required />
          <Field.Error match="valueMissing">Message</Field.Error>
        </Field.Root>
      ));

      expect(screen.queryByText('Message')).to.equal(null);

      const input = screen.getByRole<HTMLInputElement>('textbox');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(screen.queryByText('Message')).not.to.equal(null);
    });

    it('should show custom errors', async () => {
      render(() => (
        <Field.Root validate={() => 'error'}>
          <Field.Control />
          <Field.Error match="customError">Message</Field.Error>
        </Field.Root>
      ));

      const input = screen.getByRole<HTMLInputElement>('textbox');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(screen.queryByText('Message')).not.to.equal(null);
    });

    it('always renders the error message when `match` is true', async () => {
      render(() => (
        <Field.Root>
          <Field.Control required />
          <Field.Error match>Message</Field.Error>
        </Field.Root>
      ));

      expect(screen.queryByText('Message')).not.to.equal(null);
    });
  });
});
