import { createRenderer, describeConformance } from '#test-utils';
import { AlertDialog } from '@base-ui-components/solid/alert-dialog';
import { Dynamic } from 'solid-js/web';

describe('<AlertDialog.Description />', () => {
  const { render } = createRenderer();

  describeConformance(AlertDialog.Description, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <AlertDialog.Root open>
            <AlertDialog.Backdrop />
            <AlertDialog.Portal>
              <AlertDialog.Popup>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        ),
        elementProps,
      );
    },
  }));
});
