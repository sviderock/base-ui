import { createRenderer, describeConformance } from '#test-utils';
import { Dialog } from '@base-ui-components/solid/dialog';
import { Dynamic } from 'solid-js/web';

describe('<Dialog.Description />', () => {
  const { render } = createRenderer();

  describeConformance(Dialog.Description, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <Dialog.Root open modal={false}>
            <Dialog.Portal>
              <Dialog.Popup>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        ),
        elementProps,
      );
    },
  }));
});
