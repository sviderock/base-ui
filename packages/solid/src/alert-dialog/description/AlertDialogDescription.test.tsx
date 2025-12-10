import { createRenderer, describeConformance } from '#test-utils';
import { AlertDialog } from '@base-ui-components/solid/alert-dialog';

describe('<AlertDialog.Description />', () => {
  const { render } = createRenderer();

  describeConformance(AlertDialog.Description, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render: (node, props) => {
      return render(() => (
        <AlertDialog.Root open>
          <AlertDialog.Backdrop />
          <AlertDialog.Portal>
            <AlertDialog.Popup>{node(props)}</AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      ));
    },
  }));
});
