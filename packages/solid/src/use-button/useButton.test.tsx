import { isJSDOM } from '#test-utils';
import { act } from '@mui/internal-test-utils';
import { fireEvent, render, waitFor } from '@solidjs/testing-library';
import { userEvent } from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { useForkRef } from '../utils';
import { useButton } from './useButton';

vi.mock('solid-js/web', { spy: true });

describe('useButton', () => {
  describe('param: focusableWhenDisabled', () => {
    it('allows disabled buttons to be focused', async () => {
      function TestButton(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
        const [local, otherProps] = splitProps(props, ['disabled']);
        const { getButtonProps } = useButton({
          disabled: local.disabled,
          focusableWhenDisabled: true,
        });

        return <button {...getButtonProps(otherProps)} />;
      }
      const { getByRole } = render(() => <TestButton disabled />);
      const button = getByRole('button');
      await waitFor(() => button.focus());
      expect(button).toHaveFocus();
    });

    it('prevents interactions except focus and blur', async () => {
      const handleClick = spy();
      const handleKeyDown = spy();
      const handleKeyUp = spy();
      const handleFocus = spy();
      const handleBlur = spy();

      function TestButton(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
        const [local, otherProps] = splitProps(props, ['disabled']);
        const { getButtonProps } = useButton({
          disabled: local.disabled,
          focusableWhenDisabled: true,
          native: false,
        });

        return <span {...getButtonProps(otherProps)} />;
      }

      const { getByRole } = render(() => (
        <TestButton
          disabled
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      ));

      const button = getByRole('button');
      expect(document.activeElement).to.not.equal(button);

      expect(handleFocus.callCount).to.equal(0);
      await userEvent.keyboard('[Tab]');
      expect(button).toHaveFocus();
      expect(handleFocus.callCount).to.equal(1);

      await userEvent.keyboard('[Enter]');
      expect(handleKeyDown.callCount).to.equal(0);
      expect(handleClick.callCount).to.equal(0);

      await userEvent.keyboard('[Space]');
      expect(handleKeyUp.callCount).to.equal(0);
      expect(handleClick.callCount).to.equal(0);

      await userEvent.click(button);
      expect(handleKeyDown.callCount).to.equal(0);
      expect(handleKeyUp.callCount).to.equal(0);
      expect(handleClick.callCount).to.equal(0);

      expect(handleBlur.callCount).to.equal(0);
      await userEvent.keyboard('[Tab]');
      expect(handleBlur.callCount).to.equal(1);
      expect(document.activeElement).to.not.equal(button);
    });
  });

  describe('param: tabIndex', () => {
    it('returns tabIndex in getButtonProps when host component is BUTTON', async () => {
      function TestButton() {
        const { getButtonProps } = useButton();

        expect(getButtonProps().tabIndex).to.equal(0);

        return <button {...getButtonProps()} />;
      }

      const { getByRole } = render(() => <TestButton />);
      expect(getByRole('button')).to.have.property('tabIndex', 0);
    });

    it('returns tabIndex in getButtonProps when host component is not BUTTON', async () => {
      function TestButton() {
        const ref = null;
        const { getButtonProps, buttonRef } = useButton({ native: false });
        useForkRef(ref, buttonRef);

        expect(getButtonProps().tabIndex).to.equal(0);

        return <span {...getButtonProps()} />;
      }

      const { getByRole } = render(() => <TestButton />);
      expect(getByRole('button')).to.have.property('tabIndex', 0);
    });

    it('returns tabIndex in getButtonProps if it is explicitly provided', async () => {
      const customTabIndex = 3;
      function TestButton() {
        const { getButtonProps } = useButton({ tabIndex: customTabIndex });
        return <button {...getButtonProps()} />;
      }

      const { getByRole } = render(() => <TestButton />);
      expect(getByRole('button')).to.have.property('tabIndex', customTabIndex);
    });
  });

  describe('arbitrary props', () => {
    it('are passed to the host component', async () => {
      const buttonTestId = 'button-test-id';
      function TestButton() {
        const { getButtonProps } = useButton();
        return <button {...getButtonProps({ 'data-testid': buttonTestId })} />;
      }

      const { getByRole } = await render(() => <TestButton />);
      expect(getByRole('button')).to.have.attribute('data-testid', buttonTestId);
    });
  });

  describe('event handlers', () => {
    // calling preventDefault in keyUp on a <button> will not dispatch a click event if Space is pressed
    // https://codesandbox.io/p/sandbox/button-keyup-preventdefault-dn7f0
    it('key: Space fires a click event even if preventDefault was called on keyUp', async () => {
      const handleClick = spy();

      function TestButton(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton({ native: false });

        return <span {...getButtonProps(props)} />;
      }

      const { getByRole } = render(() => (
        <TestButton onKeyUp={(event) => event.preventDefault()} onClick={handleClick} />
      ));

      const button = getByRole('button');

      await userEvent.keyboard('[Tab]');
      expect(button).toHaveFocus();

      await userEvent.keyboard('[Space]');
      expect(handleClick.callCount).to.equal(1);
    });

    it('key: Enter fires keydown then click on non-native buttons', async () => {
      const handleKeyDown = spy();
      const handleClick = spy();

      function TestButton(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton({ native: false });

        return <span {...getButtonProps(props)} />;
      }

      const { getByRole } = render(() => (
        <TestButton onKeyDown={handleKeyDown} onClick={handleClick} />
      ));

      const button = getByRole('button');

      await act(() => button.focus());
      expect(button).toHaveFocus();

      expect(handleKeyDown.callCount).to.equal(0);
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleKeyDown.callCount).to.equal(1);
      expect(handleClick.callCount).to.equal(1);
    });
  });

  describe.skipIf(isJSDOM)('server-side rendering', () => {
    it('should server-side render', async () => {
      function TestButton(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
        const [local, otherProps] = splitProps(props, ['disabled']);
        const { getButtonProps } = useButton({ disabled: local.disabled, native: false });

        return <span {...getButtonProps(otherProps)} />;
      }

      const { container } = render(() => <TestButton disabled />);
      expect(container.firstChild).to.have.property('role', 'button');
    });

    it('adds disabled attribute', async () => {
      function TestButton(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
        const [local, otherProps] = splitProps(props, ['disabled']);
        const { getButtonProps } = useButton({ disabled: local.disabled });
        return <button {...getButtonProps(otherProps)} />;
      }

      const { container } = render(() => <TestButton disabled>Submit</TestButton>);
      expect(container.querySelector('button')).to.have.property('disabled');
    });
  });
});
