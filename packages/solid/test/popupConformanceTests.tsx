import { isJSDOM } from '#test-utils';
import { randomStringValue, screen, waitFor } from '@mui/internal-test-utils';
import type { render as testingLibraryRender } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createSignal, type Accessor, type Component } from 'solid-js';

export function popupConformanceTests(config: PopupTestConfig) {
  const {
    createComponent,
    triggerMouseAction,
    render,
    expectedPopupRole,
    expectedAriaHasPopupValue = expectedPopupRole,
    alwaysMounted: alwaysMountedParam = false,
  } = config;

  const alwaysMounted = alwaysMountedParam === 'only-after-open' ? false : alwaysMountedParam;

  const prepareComponent: Component<TestedComponentProps> = (props) => {
    const triggerProps = () => ({ 'data-testid': 'trigger', ...props.trigger });
    const popupProps = () => ({ 'data-testid': 'popup', ...props.popup });
    return createComponent({
      ...props,
      trigger: triggerProps(),
      popup: popupProps(),
    });
  };

  describe('Popup conformance', () => {
    describe('controlled mode', () => {
      it('opens the popup with the `open` prop', () => {
        const [open, setOpen] = createSignal(false);
        render(() => prepareComponent({ root: { open } }));
        if (!alwaysMounted) {
          expect(getPopup()).to.equal(null);
        } else {
          expect(getPopup()).toBeInaccessible();
        }

        setOpen(true);
        expect(getPopup()).not.to.equal(null);
      });
    });

    if (triggerMouseAction === 'click') {
      describe('uncontrolled mode', () => {
        it('opens the popup when clicking on the trigger', async () => {
          render(() => prepareComponent({}));

          const trigger = getTrigger();
          if (!alwaysMounted) {
            expect(getPopup()).to.equal(null);
          } else {
            expect(getPopup()).toBeInaccessible();
          }

          await userEvent.click(trigger);
          await waitFor(() => {
            expect(getPopup()).not.to.equal(null);
          });
        });
      });
    }

    if (expectedPopupRole || triggerMouseAction === 'click') {
      describe('ARIA attributes', () => {
        if (expectedPopupRole) {
          it(`has the ${expectedPopupRole} role on the popup`, async () => {
            render(() => prepareComponent({ root: { open: () => true } }));
            const popup = getPopup();
            expect(popup).not.to.equal(null);
            expect(popup).to.have.attribute('role', expectedPopupRole);
          });
        }

        if (triggerMouseAction === 'click') {
          it('has the `aria-controls` attribute on the trigger', async () => {
            render(() => prepareComponent({ root: { open: () => true } }));
            const trigger = getTrigger();
            const popup = getPopup();
            expect(trigger).to.have.attribute('aria-controls', popup?.id);
          });

          it('has the `aria-expanded` attribute on the trigger when open', async () => {
            render(() => prepareComponent({}));
            const trigger = getTrigger();
            if (!alwaysMounted) {
              expect(getPopup()).to.equal(null);
            } else {
              expect(getPopup()).toBeInaccessible();
            }
            expect(trigger).to.have.attribute('aria-expanded', 'false');
            await userEvent.click(trigger);
            await waitFor(() => {
              expect(getPopup()).to.have.attribute('data-open');
            });
            expect(trigger).to.have.attribute('aria-expanded', 'true');
          });

          if (expectedAriaHasPopupValue) {
            it('has the `aria-haspopup` attribute on the trigger', async () => {
              render(() => prepareComponent({ root: { open: () => true } }));
              const trigger = getTrigger();
              expect(trigger).to.have.attribute('aria-haspopup', expectedAriaHasPopupValue);
            });
          }

          it('allows a custom `id` prop', async () => {
            render(() => prepareComponent({ root: { open: () => true }, popup: { id: 'TestId' } }));
            const trigger = getTrigger();
            const popup = getPopup();
            expect(trigger.getAttribute('aria-controls')).to.equal(popup?.getAttribute('id'));
          });
        }
      });
    }

    describe('animations', () => {
      beforeEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      });

      afterEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      it('removes the popup when there is no exit animation defined', async ({ skip }) => {
        if (isJSDOM) {
          skip();
        }

        const [open, setOpen] = createSignal(true);
        render(() => prepareComponent({ root: { open } }));

        await waitFor(() => {
          expect(getPopup()).not.to.equal(null);
        });

        setOpen(false);
        await waitFor(() => {
          if (!alwaysMounted && alwaysMountedParam !== 'only-after-open') {
            expect(getPopup()).to.equal(null);
          } else {
            expect(getPopup()).toBeInaccessible();
          }
        });
      });

      it('removes the popup when the animation finishes', async ({ skip }) => {
        // XXX: revisit after feedback from the team
        skip();

        if (isJSDOM) {
          skip();
        }

        const handleAnimationEnd = spy();
        const animationName = `anim-${randomStringValue()}`;

        function Test(props: { open: boolean }) {
          const style = `
            @keyframes ${animationName} {
              to {
                opacity: 0;
              }
            }

            .animation-test-popup-${animationName}[data-open] {
              opacity: 1;
            }

            .animation-test-popup-${animationName}[data-ending-style] {
              animation: ${animationName} 150ms;
            }
          `;

          return (
            <div>
              {}
              <style innerHTML={style} />
              {prepareComponent({
                root: { open: () => props.open },
                portal: { keepMounted: true },
                popup: {
                  className: `animation-test-popup-${animationName}`,
                  onAnimationEnd: handleAnimationEnd,
                },
              })}
            </div>
          );
        }

        const [open, setOpen] = createSignal(true);
        render(() => <Test open={open()} />);
        setOpen(false);

        await waitFor(() => {
          const popup = getPopup();
          expect(popup).not.to.equal(null);
          expect(popup).toBeInaccessible();
        });

        await waitFor(() => {
          expect(handleAnimationEnd.callCount).to.equal(1);
        });
      });
    });
  });
}

function getTrigger() {
  return screen.getByTestId('trigger');
}

function getPopup() {
  return screen.queryByTestId('popup');
}

export interface PopupTestConfig {
  /**
   * A function that returns a JSX tree with a component to test.
   * Its parameters contain props to be spread on the component's parts.
   */
  createComponent: Component<TestedComponentProps>;
  /**
   * How the popup is triggered.
   */
  triggerMouseAction: 'click' | 'hover';
  /**
   * Render function returned from `createRenderer`.
   */
  render: typeof testingLibraryRender;
  /**
   * Expected `role` attribute of the popup element.
   */
  expectedPopupRole?: string;
  /**
   * Expected `aria-haspopup` attribute of the trigger element.
   */
  expectedAriaHasPopupValue?: string;
  /**
   * Whether the popup contents are always present in the DOM.
   */
  alwaysMounted?: boolean | 'only-after-open';
}

interface RootProps {
  open?: Accessor<boolean>;
  onOpenChange?: (open: boolean) => void;
}

interface TriggerProps {
  'data-testid'?: string;
}

interface PopupProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
  onAnimationEnd?: () => void;
}

interface PortalProps {
  keepMounted?: boolean;
}

interface TestedComponentProps {
  root?: RootProps;
  popup?: PopupProps;
  trigger?: TriggerProps;
  portal?: PortalProps;
}
