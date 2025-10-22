import { createRenderer, flushMicrotasks } from '#test-utils';
import { Toast } from '@base-ui-components/solid/toast';
import { fireEvent, screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createEffect, createSignal, For } from 'solid-js';
import { useToastManager } from './useToastManager';
import { List } from './utils/test-utils';

describe('useToast', () => {
  describe('add', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    it('adds a toast to the viewport that auto-dismisses after 5s by default', async () => {
      function AddButton() {
        const { add } = useToastManager();
        return (
          <button
            onClick={() => {
              add({
                title: 'test',
              });
            }}
          >
            add
          </button>
        );
      }

      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>
      ));

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);

      expect(screen.queryByTestId('root')).not.to.equal(null);

      clock.tick(5000);

      expect(screen.queryByTestId('root')).to.equal(null);
    });

    describe('option: timeout', () => {
      it('dismisses the toast after the specified timeout', async () => {
        function AddButton() {
          const { add } = useToastManager();
          return <button onClick={() => add({ title: 'test', timeout: 1000 })}>add</button>;
        }

        render(() => (
          <Toast.Provider>
            <Toast.Viewport>
              <List />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>
        ));

        const button = screen.getByRole('button', { name: 'add' });
        fireEvent.click(button);

        expect(screen.queryByTestId('root')).not.to.equal(null);

        clock.tick(1000);

        expect(screen.queryByTestId('root')).to.equal(null);
      });
    });

    describe('option: title', () => {
      it('renders the title', async () => {
        function AddButton() {
          const { add } = useToastManager();
          return (
            <button
              onClick={() =>
                add({
                  title: 'title',
                  description: 'description',
                })
              }
            >
              add
            </button>
          );
        }

        function CustomList() {
          const { toasts } = useToastManager();
          return (
            <For each={toasts()}>
              {(t) => (
                <Toast.Root toast={t} data-testid="root">
                  <Toast.Title data-testid="title">{t.title}</Toast.Title>
                </Toast.Root>
              )}
            </For>
          );
        }

        render(() => (
          <Toast.Provider>
            <Toast.Viewport>
              <CustomList />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>
        ));

        const button = screen.getByRole('button', { name: 'add' });
        fireEvent.click(button);

        expect(screen.queryByTestId('title')).to.have.text('title');
      });
    });

    describe('option: description', () => {
      it('renders the description', async () => {
        function AddButton() {
          const { add } = useToastManager();
          return (
            <button
              onClick={() =>
                add({
                  title: 'title',
                  description: 'description',
                })
              }
            >
              add
            </button>
          );
        }

        function CustomList() {
          const { toasts } = useToastManager();
          return (
            <For each={toasts()}>
              {(t) => (
                <Toast.Root toast={t} data-testid="root">
                  <Toast.Description data-testid="description">{t.description}</Toast.Description>
                </Toast.Root>
              )}
            </For>
          );
        }

        render(() => (
          <Toast.Provider>
            <Toast.Viewport>
              <CustomList />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>
        ));

        const button = screen.getByRole('button', { name: 'add' });
        fireEvent.click(button);

        expect(screen.queryByTestId('description')).to.have.text('description');
      });
    });

    describe('option: type', () => {
      it('renders the type', async () => {
        function AddButton() {
          const { add } = useToastManager();
          return <button onClick={() => add({ title: 'test', type: 'success' })}>add</button>;
        }

        function CustomList() {
          const { toasts } = useToastManager();
          return (
            <For each={toasts()}>
              {(t) => (
                <Toast.Root toast={t} data-testid="root">
                  <Toast.Title data-testid="title">{t.title}</Toast.Title>
                  <span>{t.type}</span>
                </Toast.Root>
              )}
            </For>
          );
        }

        render(() => (
          <Toast.Provider>
            <Toast.Viewport>
              <CustomList />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>
        ));

        const button = screen.getByRole('button', { name: 'add' });
        fireEvent.click(button);

        expect(screen.queryByTestId('title')).to.have.text('test');
        expect(screen.queryByText('success')).not.to.equal(null);
      });
    });

    describe('option: onClose', () => {
      it('calls onClose when the toast is closed', async () => {
        const onCloseSpy = spy();

        function AddButton() {
          const { add, close } = useToastManager();
          let idRef: string | undefined;
          return (
            <>
              <button
                onClick={() => {
                  idRef = add({
                    title: 'test',
                    onClose: onCloseSpy,
                  });
                }}
              >
                add
              </button>
              <button
                onClick={() => {
                  if (idRef) {
                    close(idRef);
                  }
                }}
              >
                close
              </button>
            </>
          );
        }

        render(() => (
          <Toast.Provider>
            <Toast.Viewport>
              <List />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>
        ));

        const addButton = screen.getByRole('button', { name: 'add' });
        fireEvent.click(addButton);

        expect(onCloseSpy.callCount).to.equal(0);

        const closeButton = screen.getByRole('button', { name: 'close' });
        fireEvent.click(closeButton);

        expect(onCloseSpy.callCount).to.equal(1);
      });

      it('calls onClose when the toast auto-dismisses', async () => {
        const onCloseSpy = spy();

        function AddButton() {
          const { add } = useToastManager();
          return (
            <button
              onClick={() => {
                add({
                  title: 'test',
                  timeout: 1000,
                  onClose: onCloseSpy,
                });
              }}
            >
              add
            </button>
          );
        }

        render(() => (
          <Toast.Provider>
            <Toast.Viewport>
              <List />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>
        ));

        const button = screen.getByRole('button', { name: 'add' });
        fireEvent.click(button);

        expect(onCloseSpy.callCount).to.equal(0);

        clock.tick(1000);

        expect(onCloseSpy.callCount).to.equal(1);
      });
    });

    describe('option: onRemove', () => {
      it('calls onRemove when the toast is removed', async () => {
        const onRemoveSpy = spy();

        function AddButton() {
          const { add, close } = useToastManager();
          let idRef: string | undefined;
          return (
            <>
              <button
                onClick={() => {
                  idRef = add({
                    title: 'test',
                    onRemove: onRemoveSpy,
                  });
                }}
              >
                add
              </button>
              <button
                onClick={() => {
                  if (idRef) {
                    close(idRef);
                  }
                }}
              >
                close
              </button>
            </>
          );
        }

        render(() => (
          <Toast.Provider>
            <Toast.Viewport>
              <List />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>
        ));

        const addButton = screen.getByRole('button', { name: 'add' });
        fireEvent.click(addButton);

        expect(onRemoveSpy.callCount).to.equal(0);

        const closeButton = screen.getByRole('button', { name: 'close' });
        fireEvent.click(closeButton);

        expect(onRemoveSpy.callCount).to.equal(1);
      });
    });

    describe('option: priority', () => {
      it('applies correct ARIA attributes based on priority', async () => {
        function AddButton() {
          const { add } = useToastManager();
          return (
            <>
              <button onClick={() => add({ title: 'high priority', priority: 'high' })}>
                add high
              </button>
              <button onClick={() => add({ title: 'low priority', priority: 'low' })}>
                add low
              </button>
            </>
          );
        }

        render(() => (
          <Toast.Provider>
            <Toast.Viewport>
              <List />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>
        ));

        const highPriorityButton = screen.getByRole('button', { name: 'add high' });
        fireEvent.click(highPriorityButton);

        const highRoot = screen.getByTestId('root');

        expect(highRoot.getAttribute('role')).to.equal('alertdialog');
        expect(highRoot.getAttribute('aria-modal')).to.equal('false');
        expect(screen.getByRole('alert')).to.not.equal(null);
        expect(screen.getByRole('alert').getAttribute('aria-atomic')).to.equal('true');

        const closeHighButton = screen.getByRole('button', { name: 'close-press' });
        fireEvent.click(closeHighButton);

        const lowPriorityButton = screen.getByRole('button', { name: 'add low' });
        fireEvent.click(lowPriorityButton);

        const lowRoot = screen.getByTestId('root');

        expect(lowRoot.getAttribute('role')).to.equal('dialog');
        expect(lowRoot.getAttribute('aria-modal')).to.equal('false');
        expect(screen.getByRole('status')).to.not.equal(null);
        expect(screen.getByRole('status').getAttribute('aria-live')).to.equal('polite');
      });
    });
  });

  describe('promise', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    function CustomList() {
      const { toasts } = useToastManager();
      return (
        <For each={toasts()}>
          {(t) => (
            <Toast.Root toast={t} data-testid="root">
              <Toast.Title data-testid="title">{t.title}</Toast.Title>
              <Toast.Description data-testid="description">{t.description}</Toast.Description>
              <span>{t.type}</span>
            </Toast.Root>
          )}
        </For>
      );
    }

    it('displays success state as description after promise resolves', async () => {
      function AddButton() {
        const { promise } = useToastManager();
        return (
          <button
            onClick={() => {
              promise(
                new Promise((res) => {
                  setTimeout(() => {
                    res('success');
                  }, 1000);
                }),
                {
                  loading: 'loading',
                  success: 'success',
                  error: 'error',
                },
              );
            }}
          >
            add
          </button>
        );
      }

      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <CustomList />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>
      ));

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);

      expect(screen.getByTestId('description')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.getByTestId('description')).to.have.text('success');
    });

    it('displays error state as description after promise rejects', async () => {
      function AddButton() {
        const { promise } = useToastManager();
        return (
          <button
            onClick={() => {
              promise(
                new Promise((res, rej) => {
                  setTimeout(() => {
                    rej(new Error('error'));
                  }, 1000);
                }),
                {
                  loading: 'loading',
                  success: 'success',
                  error: 'error',
                },
              ).catch(() => {
                // Explicitly catch rejection to prevent test failure
              });
            }}
          >
            add
          </button>
        );
      }

      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <CustomList />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>
      ));

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);

      expect(screen.getByTestId('description')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.getByTestId('description')).to.have.text('error');
    });

    it('passes data when success is a function', async () => {
      function AddButton() {
        const { promise } = useToastManager();
        return (
          <button
            onClick={() =>
              promise(
                new Promise((res) => {
                  res('test success');
                }),
                {
                  loading: 'loading',
                  success: (data) => `${data}`,
                  error: 'error',
                },
              )
            }
          >
            add
          </button>
        );
      }

      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <CustomList />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>
      ));

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);

      expect(screen.getByTestId('description')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.getByTestId('description')).to.have.text('test success');
    });

    it('passes data when error is a function', async () => {
      function AddButton() {
        const { promise } = useToastManager();
        return (
          <button
            onClick={() =>
              promise(
                new Promise((res, rej) => {
                  rej(new Error('test error'));
                }),
                {
                  loading: 'loading',
                  success: 'success',
                  error: (error: Error) => `${error.message}`,
                },
              ).catch(() => {
                // Explicitly catch rejection to prevent test failure
              })
            }
          >
            add
          </button>
        );
      }

      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <CustomList />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>
      ));

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);

      expect(screen.getByTestId('description')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.getByTestId('description')).to.have.text('test error');
    });

    it('supports custom options', async () => {
      function AddButton() {
        const { promise } = useToastManager();
        return (
          <button
            onClick={() =>
              promise(
                new Promise((res) => {
                  res('success');
                }),
                {
                  loading: {
                    title: 'loading title',
                    description: 'loading description',
                  },
                  success: 'success',
                  error: 'error',
                },
              )
            }
          >
            add
          </button>
        );
      }

      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <CustomList />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>
      ));

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);

      expect(screen.getByTestId('title')).to.have.text('loading title');
      expect(screen.getByTestId('description')).to.have.text('loading description');

      await flushMicrotasks();
    });
  });

  describe('update', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    function CustomList() {
      const { toasts } = useToastManager();
      return (
        <For each={toasts()}>
          {(t) => (
            <Toast.Root toast={t} data-testid="root">
              <Toast.Title data-testid="title">{t.title}</Toast.Title>
            </Toast.Root>
          )}
        </For>
      );
    }

    it('updates the toast', async () => {
      function AddButton() {
        const { add, update } = useToastManager();
        let idRef: string | undefined;
        return (
          <>
            <button
              type="button"
              onClick={() => {
                idRef = add({ title: 'test' });
              }}
            >
              add
            </button>
            <button
              type="button"
              onClick={() => {
                if (idRef) {
                  update(idRef, { title: 'updated' });
                }
              }}
            >
              update
            </button>
          </>
        );
      }

      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <CustomList />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>
      ));

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);

      expect(screen.getByTestId('title')).to.have.text('test');

      const updateButton = screen.getByRole('button', { name: 'update' });
      fireEvent.click(updateButton);

      expect(screen.getByTestId('title')).to.have.text('updated');
    });
  });

  describe('close', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    function CustomList() {
      const { toasts } = useToastManager();
      return (
        <For each={toasts()}>
          {(t) => (
            <Toast.Root toast={t} data-testid="root">
              <Toast.Title data-testid="title">{t.title}</Toast.Title>
            </Toast.Root>
          )}
        </For>
      );
    }

    it('closes a toast', async () => {
      function AddButton() {
        const { add, close } = useToastManager();
        let idRef: string | undefined;
        return (
          <>
            <button
              onClick={() => {
                idRef = add({ title: 'test' });
              }}
            >
              add
            </button>
            <button
              onClick={() => {
                if (idRef) {
                  close(idRef);
                }
              }}
            >
              close
            </button>
          </>
        );
      }

      render(() => (
        <Toast.Provider>
          <Toast.Viewport>
            <CustomList />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>
      ));

      const addButton = screen.getByRole('button', { name: 'add' });
      fireEvent.click(addButton);

      expect(screen.getByTestId('root')).not.to.equal(null);

      const closeButton = screen.getByRole('button', { name: 'close' });
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('root')).to.equal(null);
    });
  });

  describe('prop: limit', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    function TestList() {
      const [count, setCount] = createSignal(0);
      const { toasts, add } = useToastManager();

      return (
        <>
          <For each={toasts()}>
            {(t) => (
              <Toast.Root toast={t} data-testid={t.title}>
                <Toast.Close data-testid={`close-${t.title}`} />
              </Toast.Root>
            )}
          </For>
          <button
            onClick={() => {
              const nextCount = count() + 1;
              setCount(nextCount);
              add({ title: `toast-${nextCount}` });
            }}
          >
            add
          </button>
        </>
      );
    }

    it('marks toasts as limited when the limit is exceeded', async () => {
      render(() => (
        <Toast.Provider limit={2}>
          <Toast.Viewport>
            <TestList />
          </Toast.Viewport>
        </Toast.Provider>
      ));

      const addButton = screen.getByRole('button', { name: 'add' });

      fireEvent.click(addButton);
      expect(screen.getByTestId('toast-1')).not.to.have.attribute('data-limited');

      fireEvent.click(addButton);
      expect(screen.getByTestId('toast-2')).not.to.have.attribute('data-limited');

      fireEvent.click(addButton);
      expect(screen.getByTestId('toast-3')).not.to.have.attribute('data-limited');
      expect(screen.getByTestId('toast-1')).to.have.attribute('data-limited');
    });

    it('unmarks toasts as limited when the limit is not exceeded', async () => {
      render(() => (
        <Toast.Provider limit={2}>
          <Toast.Viewport>
            <TestList />
          </Toast.Viewport>
        </Toast.Provider>
      ));

      const addButton = screen.getByRole('button', { name: 'add' });

      fireEvent.click(addButton);
      const toast1 = screen.getByTestId('toast-1');
      expect(toast1).not.to.have.attribute('data-limited');

      fireEvent.click(addButton);
      const toast2 = screen.getByTestId('toast-2');
      expect(toast2).not.to.have.attribute('data-limited');

      fireEvent.click(addButton);
      const toast3 = screen.getByTestId('toast-3');
      expect(toast3).not.to.have.attribute('data-limited');

      const closeToast3 = screen.getByTestId('close-toast-3');
      fireEvent.click(closeToast3);

      expect(toast1).not.to.have.attribute('data-limited');
    });
  });
});
