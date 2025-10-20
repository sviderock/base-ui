import { createRenderer, describeConformance } from '#test-utils';
import { Radio } from '@base-ui-components/solid/radio';
import { RadioGroup } from '@base-ui-components/solid/radio-group';
import { fireEvent, screen } from '@solidjs/testing-library';
import { expect } from 'chai';

describe('<Radio.Root />', () => {
  const { render } = createRenderer();

  describeConformance(
    (props: any) => <Radio.Root {...props} ref={props.ref} value="" />,
    () => ({
      refInstanceof: window.HTMLButtonElement,
      render,
    }),
  );

  it('does not forward `value` prop', async () => {
    render(() => (
      <RadioGroup>
        <Radio.Root value="test" data-testid="radio-root" />
      </RadioGroup>
    ));

    expect(screen.getByTestId('radio-root')).not.to.have.attribute('value');
  });

  it('allows `null` value', async () => {
    render(() => (
      <RadioGroup>
        <Radio.Root value={null} data-testid="radio-null" />
        <Radio.Root value="a" data-testid="radio-a" />
      </RadioGroup>
    ));

    const radioNull = screen.getByTestId('radio-null');
    const radioA = screen.getByTestId('radio-a');
    fireEvent.click(radioNull);
    expect(radioNull).to.have.attribute('aria-checked', 'true');
    fireEvent.click(radioA);
    expect(radioNull).to.have.attribute('aria-checked', 'false');
  });
});
