import { createRenderer, describeConformance } from '#test-utils';
import { Toast } from '@base-ui-components/solid/toast';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';
import { Button, List } from '../utils/test-utils';

describe('<Toast.Close />', () => {
  const { render } = createRenderer();

  const toast: Toast.Root.ToastObject = {
    id: 'test',
    title: 'title',
  };

  describeConformance(Toast.Close, () => ({
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
  }));

  it('closes the toast when clicked', async () => {
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

    expect(screen.getByTestId('title')).not.to.equal(null);

    const closeButton = screen.getByRole('button', { name: 'close-press' });

    await user.click(closeButton);

    expect(screen.queryByTestId('title')).to.equal(null);
  });
});
