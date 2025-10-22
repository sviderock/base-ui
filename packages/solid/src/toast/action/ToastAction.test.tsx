import { createRenderer, describeConformance } from '#test-utils';
import { Toast } from '@base-ui-components/solid/toast';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';
import { Button, List } from '../utils/test-utils';

describe('<Toast.Action />', () => {
  const { render } = createRenderer();

  const toast: Toast.Root.ToastObject = {
    id: 'test',
    title: 'title',
  };

  describeConformance(
    (props: any) => (
      <Toast.Action {...props} ref={props.ref}>
        action
      </Toast.Action>
    ),
    () => ({
      refInstanceof: window.HTMLButtonElement,
      render(node, elementProps = {}) {
        return render(
          () => (
            <Toast.Provider>
              <Toast.Viewport>
                <Toast.Root toast={toast}>
                  <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
                </Toast.Root>
              </Toast.Viewport>
            </Toast.Provider>
          ),
          elementProps,
        );
      },
    }),
  );

  it('performs an action when clicked', async () => {
    const { user } = render(() => (
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>
    ));

    const button = screen.getByRole('button', { name: 'add' });

    await user.click(button);

    expect(screen.getByTestId('action').id).to.equal('action');
  });

  it('does not render if it has no children', async () => {
    function AddButton() {
      const { add } = Toast.useToastManager();
      return (
        <button
          type="button"
          onClick={() =>
            add({
              actionProps: {
                children: undefined,
              },
            })
          }
        >
          add
        </button>
      );
    }

    const { user } = render(() => (
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <AddButton />
      </Toast.Provider>
    ));

    const button = screen.getByRole('button', { name: 'add' });
    await user.click(button);

    const actionElement = screen.queryByTestId('action');
    expect(actionElement).to.equal(null);
  });
});
