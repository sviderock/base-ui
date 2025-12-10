import { createRenderer, describeConformance } from '#test-utils';
import { Dialog } from '@base-ui-components/solid/dialog';

describe('<Dialog.Description />', () => {
  const { render } = createRenderer();

  describeConformance(Dialog.Description, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render: (node, props) =>
      render(() => (
        <Dialog.Root open modal={false}>
          <Dialog.Portal>
            <Dialog.Popup>{node(props)}</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )),
  }));
});
