import c from 'clsx';
import {
  type Accessor,
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  type JSX,
  on,
  onCleanup,
  Show,
  splitProps,
  useContext,
} from 'solid-js';
import { CompositeList } from '../../src/composite/list/CompositeList';
import { useCompositeListItem } from '../../src/composite/list/useCompositeListItem';
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingNode,
  FloatingPortal,
  FloatingTree,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useFloatingTree,
  useHover,
  useInteractions,
  useListNavigation,
  useRole,
} from '../../src/floating-ui-solid';
import { callEventHandler } from '../../src/solid-helpers';

type MenuContextType = {
  getItemProps: (userProps?: JSX.HTMLAttributes<HTMLElement>) => Record<string, unknown>;
  activeIndex: Accessor<number | null>;
  setActiveIndex: (value: number | null) => void;
  setHasFocusInside: (value: boolean) => void;
  allowHover: Accessor<boolean>;
  isOpen: Accessor<boolean>;
  setIsOpen: (value: boolean) => void;
  parent: MenuContextType | null;
};

const MenuContext = createContext<MenuContextType>({
  getItemProps: () => ({}),
  activeIndex: () => null,
  setActiveIndex: () => {},
  setHasFocusInside: () => {},
  allowHover: () => true,
  isOpen: () => false,
  setIsOpen: () => {},
  parent: null,
});

interface MenuProps {
  label: string;
  nested?: boolean;
  children?: JSX.Element;
  refs?: {
    virtualItemRef: HTMLElement | null | undefined;
  };
}

/** @internal */
export function MenuComponent(props: MenuProps & JSX.HTMLAttributes<HTMLElement>) {
  const [local, elementProps] = splitProps(props, ['children', 'label', 'refs']);
  const [isOpen, setIsOpen] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal<number | null>(null);
  const [allowHover, setAllowHover] = createSignal(false);
  const [hasFocusInside, setHasFocusInside] = createSignal(false);

  const compositeListRefs = {
    elements: [] as Array<HTMLElement | null>,
    labels: [] as Array<string | null>,
  };

  const tree = useFloatingTree();
  const nodeId = useFloatingNodeId();
  const parentId = useFloatingParentNodeId();
  const isNested = parentId != null;

  const parent = useContext(MenuContext);
  const item = useCompositeListItem();

  const { floatingStyles, refs, context } = useFloating({
    nodeId,
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: isNested ? 'right-start' : 'bottom-start',
    middleware: [
      offset({ mainAxis: isNested ? 0 : 4, alignmentAxis: isNested ? -4 : 0 }),
      flip(),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    enabled: () => isNested && allowHover(),
    delay: { open: 75 },
    handleClose: safePolygon({ blockPointerEvents: true }),
  });
  const role = useRole(context, { role: 'menu' });
  const dismiss = useDismiss(context, { bubbles: true });
  const listNavigation = useListNavigation(context, {
    listRef: compositeListRefs.elements,
    activeIndex,
    nested: isNested,
    onNavigate: setActiveIndex,
    virtual: true,
    // eslint-disable-next-line solid/reactivity
    refs: props.refs,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    hover,
    role,
    dismiss,
    listNavigation,
  ]);

  // Event emitter allows you to communicate across tree components.
  // This effect closes all menus when an item gets clicked anywhere
  // in the tree.
  createEffect(() => {
    if (!tree) {
      return;
    }

    function handleTreeClick() {
      setIsOpen(false);
    }

    function onSubMenuOpen(event: { nodeId: string; parentId: string }) {
      if (event.nodeId !== nodeId() && event.parentId === parentId) {
        setIsOpen(false);
      }
    }

    tree.events.on('click', handleTreeClick);
    tree.events.on('menuopen', onSubMenuOpen);

    onCleanup(() => {
      tree.events.off('click', handleTreeClick);
      tree.events.off('menuopen', onSubMenuOpen);
    });
  });

  createEffect(() => {
    if (isOpen() && tree) {
      tree.events.emit('menuopen', { parentId, nodeId: nodeId() });
    }
  });

  // Determine if "hover" logic can run based on the modality of input. This
  // prevents unwanted focus synchronization as menus open and close with
  // keyboard navigation and the cursor is resting on the menu.
  createEffect(
    on(allowHover, () => {
      function onPointerMove({ pointerType }: PointerEvent) {
        if (pointerType !== 'touch') {
          setAllowHover(true);
        }
      }

      function onKeyDown() {
        setAllowHover(false);
      }

      window.addEventListener('pointermove', onPointerMove, {
        once: true,
        capture: true,
      });
      window.addEventListener('keydown', onKeyDown, true);
      onCleanup(() => {
        window.removeEventListener('pointermove', onPointerMove, {
          capture: true,
        });
        window.removeEventListener('keydown', onKeyDown, true);
      });
    }),
  );

  const id = createUniqueId();

  return (
    <FloatingNode id={nodeId()}>
      {isNested ? (
        // eslint-disable-next-line jsx-a11y/role-supports-aria-props
        <div
          id={id}
          ref={(el) => {
            refs.setReference(el);
            item.setRef(el);
            if (typeof props.ref === 'function') {
              props.ref(el);
            } else {
              props.ref = el;
            }
          }}
          data-open={isOpen() ? '' : undefined}
          tabIndex={-1}
          role="menuitem"
          aria-autocomplete="list"
          class={c(
            props.class ||
              'flex cursor-default items-center justify-between gap-4 rounded px-2 py-1 text-left',
            {
              'bg-red-500 text-white': parent.activeIndex() === item.index(),
              'focus:bg-red-500 outline-none': isNested,
              'bg-red-100 text-red-900': isOpen() && isNested && !hasFocusInside(),
              'bg-red-100 rounded px-2 py-1': isNested && isOpen() && hasFocusInside(),
            },
          )}
          {...getReferenceProps({
            ...parent.getItemProps({
              ...elementProps,
              onFocus(event) {
                callEventHandler(props.onFocus, event);
                setHasFocusInside(false);
                parent.setHasFocusInside(true);
              },
              onMouseEnter(event) {
                callEventHandler(props.onMouseEnter, event);
                if (parent.allowHover() && parent.isOpen()) {
                  parent.setActiveIndex(item.index());
                }
              },
            }),
          })}
        >
          {local.label}
          {isNested && (
            <span aria-hidden class="ml-4">
              Icon
            </span>
          )}
        </div>
      ) : (
        <input
          class="border-slate-500 border"
          ref={(el) => {
            refs.setReference(el);
            item.setRef(el);
            if (typeof props.ref === 'function') {
              props.ref(el);
            } else {
              props.ref = el;
            }
          }}
          id={id}
          data-open={isOpen() ? '' : undefined}
          tabIndex={isNested ? -1 : 0}
          // eslint-disable-next-line jsx-a11y/role-has-required-aria-props
          role="combobox"
          aria-autocomplete="list"
          {...getReferenceProps({
            onKeyDown(event) {
              if (event.key === ' ' || event.key === 'Enter') {
                // eslint-disable-next-line
                console.log('clicked', props.refs?.virtualItemRef);
              }
            },
          })}
        />
      )}
      <MenuContext.Provider
        value={{
          activeIndex,
          setActiveIndex,
          getItemProps,
          setHasFocusInside,
          allowHover,
          isOpen,
          setIsOpen,
          parent,
        }}
      >
        <CompositeList refs={compositeListRefs}>
          {isOpen() && (
            <FloatingPortal>
              <FloatingFocusManager context={context} initialFocus={-1} returnFocus={!isNested}>
                <div
                  ref={refs.setFloating}
                  class="border-slate-900/10 flex flex-col rounded border bg-white bg-clip-padding p-1 shadow-lg outline-none"
                  style={floatingStyles()}
                  {...getFloatingProps({})}
                >
                  {local.children}
                </div>
              </FloatingFocusManager>
            </FloatingPortal>
          )}
        </CompositeList>
      </MenuContext.Provider>
    </FloatingNode>
  );
}

interface MenuItemProps {
  label: string;
  disabled?: boolean;
}

/** @internal */
export function MenuItem(props: MenuItemProps & JSX.HTMLAttributes<HTMLElement>) {
  const [local, elementProps] = splitProps(props, ['label', 'disabled']);

  const menu = useContext(MenuContext);
  const item = useCompositeListItem({ label: () => (local.disabled ? null : local.label) });
  const tree = useFloatingTree();
  const isActive = () => item.index() === menu.activeIndex();
  const id = createUniqueId();

  return (
    <div
      {...elementProps}
      id={id}
      ref={(el) => {
        item.setRef(el);
        if (typeof props.ref === 'function') {
          props.ref(el);
        } else {
          props.ref = el;
        }
      }}
      role="option"
      tabIndex={-1}
      aria-selected={isActive()}
      aria-disabled={local.disabled}
      class={c('focus:bg-red-500 flex cursor-default rounded px-2 py-1 text-left outline-none', {
        'opacity-40': local.disabled,
        'bg-red-500 text-white': isActive(),
      })}
      {...menu.getItemProps({
        onClick(event) {
          callEventHandler(props.onClick, event);
          tree?.events.emit('click');
        },
        onFocus(event) {
          callEventHandler(props.onFocus, event);
          menu.setHasFocusInside(true);
        },
        onMouseEnter(event) {
          callEventHandler(props.onMouseEnter, event);
          if (menu.allowHover() && menu.isOpen()) {
            menu.setActiveIndex(item.index());
          }
        },
        onKeyDown(event) {
          function closeParents(parent: MenuContextType | null) {
            parent?.setIsOpen(false);
            if (parent?.parent) {
              closeParents(parent.parent);
            }
          }

          if (
            event.key === 'ArrowRight' &&
            // If the root reference is in a menubar, close parents
            tree?.nodesRef[0]?.context?.elements.domReference()?.closest('[role="menubar"]')
          ) {
            closeParents(menu.parent);
          }
        },
      })}
    >
      {local.label}
    </div>
  );
}

/** @internal */
export function Menu(props: MenuProps & JSX.HTMLAttributes<HTMLElement>) {
  const parentId = useFloatingParentNodeId();
  return (
    <Show when={parentId === null} fallback={<MenuComponent {...props} />}>
      <FloatingTree>
        <MenuComponent {...props} />
      </FloatingTree>
    </Show>
  );
}

/** @internal */
export function Main() {
  const refs = { virtualItemRef: null } as any;

  return (
    <>
      <h1 class="mb-8 text-5xl font-bold">Menu Virtual</h1>
      <div class="border-slate-400 mb-4 grid h-[20rem] place-items-center rounded border lg:w-[40rem]">
        <Menu label="Edit" refs={refs}>
          <MenuItem
            label="Undo"
            onClick={() => {
              // eslint-disable-next-line no-console
              return console.log('Undo');
            }}
          />
          <MenuItem label="Redo" />
          <MenuItem label="Cut" disabled />
          <Menu label="Copy as" refs={refs}>
            <MenuItem label="Text" />
            <MenuItem label="Video" />
            <Menu label="Image" refs={refs}>
              <MenuItem label=".png" />
              <MenuItem label=".jpg" />
              <MenuItem label=".svg" />
              <MenuItem label=".gif" />
            </Menu>
            <MenuItem label="Audio" />
          </Menu>
          <Menu label="Share" refs={refs}>
            <MenuItem label="Mail" />
            <MenuItem label="Instagram" />
          </Menu>
        </Menu>
      </div>
    </>
  );
}
