import { createRenderer, describeConformance } from '#test-utils';
import { Switch } from '@base-ui-components/solid/switch';
import { Dynamic } from 'solid-js/web';
import { SwitchRootContext } from '../root/SwitchRootContext';

const testContext: SwitchRootContext = {
  checked: () => false,
  disabled: () => false,
  readOnly: () => false,
  required: () => false,
  dirty: () => false,
  touched: () => false,
  filled: () => false,
  focused: () => false,
  valid: () => null,
};

describe('<Switch.Thumb />', () => {
  const { render } = createRenderer();

  describeConformance(Switch.Thumb, () => ({
    refInstanceof: window.HTMLSpanElement,
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <SwitchRootContext.Provider value={testContext}>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </SwitchRootContext.Provider>
        ),
        elementProps,
      );
    },
  }));
});
