import { createRenderer, describeConformance } from '#test-utils';
import { AlertDialog } from '@msviderok/base-ui-solid/alert-dialog';

describe('<AlertDialog.Title />', () => {
  const { render } = createRenderer();

  describeConformance(AlertDialog.Title, () => ({
    refInstanceof: window.HTMLHeadingElement,
    render: (node, props) =>
      render(() => (
        <AlertDialog.Root open>
          <AlertDialog.Backdrop />
          <AlertDialog.Portal>
            <AlertDialog.Popup>{node(props)}</AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      )),
  }));
});
