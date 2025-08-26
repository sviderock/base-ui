import type { RefSignal } from '@base-ui-components/solid/solid-helpers';
import c from 'clsx';
import * as React from 'react';
import {
  type Accessor,
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  type JSX,
  onCleanup,
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
import { useForkRefN } from '../../src/utils/useForkRef';

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
  virtualItemRef: RefSignal<HTMLElement>;
}

// children,
//   label,
//   virtualItemRef,
//   ...props

/** @internal */
export function MenuComponent(props: MenuProps & JSX.HTMLAttributes<HTMLElement>) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal<number | null>(null);
  const [allowHover, setAllowHover] = createSignal(false);
  const [hasFocusInside, setHasFocusInside] = createSignal(false);

  const elementsRef: Array<HTMLElement | undefined> = [];
  const labelsRef: Array<string | null> = [];

  const tree = useFloatingTree();
  const nodeId = useFloatingNodeId();
  const parentId = useFloatingParentNodeId();
  const isNested = () => parentId() != null;

  const parent = useContext(MenuContext);
  const item = useCompositeListItem();

  const { floatingStyles, refs, context } = useFloating({
    nodeId,
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: () => (isNested() ? 'right-start' : 'bottom-start'),
    middleware: () => [
      offset({ mainAxis: isNested() ? 0 : 4, alignmentAxis: isNested() ? -4 : 0 }),
      flip(),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    enabled: () => isNested() && allowHover(),
    delay: () => ({ open: 75 }),
    handleClose: safePolygon({ blockPointerEvents: true }),
  });
  const role = useRole(context, { role: () => 'menu' });
  const dismiss = useDismiss(context, { bubbles: () => true });
  const listNavigation = useListNavigation(context, {
    listRef: elementsRef,
    activeIndex,
    nested: isNested,
    onNavigate: setActiveIndex,
    virtual: () => true,
    virtualItemRef: props.virtualItemRef,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(() => [
    hover(),
    role(),
    dismiss(),
    listNavigation(),
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
      if (event.nodeId !== nodeId() && event.parentId === parentId()) {
        setIsOpen(false);
      }
    }

    tree.events.on('click', handleTreeClick);
    tree.events.on('menuopen', onSubMenuOpen);

    // eslint-disable-next-line consistent-return
    onCleanup(() => {
      tree.events.off('click', handleTreeClick);
      tree.events.off('menuopen', onSubMenuOpen);
    });
  });

  createEffect(() => {
    if (isOpen() && tree) {
      tree.events.emit('menuopen', { parentId: parentId(), nodeId: nodeId() });
    }
  });

  // Determine if "hover" logic can run based on the modality of input. This
  // prevents unwanted focus synchronization as menus open and close with
  // keyboard navigation and the cursor is resting on the menu.
  createEffect(() => {
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
  });

  const id = createUniqueId();

  return (
    <FloatingNode id={nodeId()}>
      {isNested ? (
        // eslint-disable-next-line jsx-a11y/role-supports-aria-props
        <div
          id={id}
          ref={useForkRefN([
            refs.setReference,
            item.ref,
            (el) => {
              props.ref = el;
            },
          ])}
          data-open={isOpen() ? '' : undefined}
          tabIndex={-1}
          role="menuitem"
          aria-autocomplete="list"
          class={c(
            props.class ||
              'flex cursor-default items-center justify-between gap-4 rounded px-2 py-1 text-left',
            {
              'bg-red-500 text-white': parent.activeIndex() === item.index(),
              'focus:bg-red-500 outline-none': isNested(),
              'bg-red-100 text-red-900': isOpen() && isNested() && !hasFocusInside(),
              'bg-red-100 rounded px-2 py-1': isNested() && isOpen() && hasFocusInside(),
            },
          )}
          {...getReferenceProps({
            ...parent.getItemProps({
              ...props,
              onFocus(event) {
                props.onFocus?.(event);
                setHasFocusInside(false);
                parent.setHasFocusInside(true);
              },
              onMouseEnter(event) {
                props.onMouseEnter?.(event);
                if (parent.allowHover() && parent.isOpen()) {
                  parent.setActiveIndex(item.index());
                }
              },
            }),
          })}
        >
          {props.label}
          {isNested() && (
            <span aria-hidden class="ml-4">
              Icon
            </span>
          )}
        </div>
      ) : (
        <input
          className="border-slate-500 border"
          ref={mergedRef}
          id={id}
          data-open={isOpen ? '' : undefined}
          tabIndex={isNested ? -1 : 0}
          // eslint-disable-next-line jsx-a11y/role-has-required-aria-props
          role="combobox"
          aria-autocomplete="list"
          {...getReferenceProps({
            onKeyDown(event) {
              if (event.key === ' ' || event.key === 'Enter') {
                // eslint-disable-next-line
                console.log('clicked', virtualItemRef.current);
              }
            },
          })}
        />
      )}
      <MenuContext.Provider
        // eslint-disable-next-line react/jsx-no-constructed-context-values
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
        <CompositeList elementsRef={elementsRef} labelsRef={labelsRef}>
          {isOpen && (
            <FloatingPortal>
              <FloatingFocusManager context={context} initialFocus={-1} returnFocus={!isNested}>
                <div
                  ref={refs.setFloating}
                  className="border-slate-900/10 flex flex-col rounded border bg-white bg-clip-padding p-1 shadow-lg outline-none"
                  style={floatingStyles}
                  {...getFloatingProps()}
                >
                  {children}
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
export const MenuItem = React.forwardRef<
  HTMLElement,
  MenuItemProps & React.HTMLAttributes<HTMLElement>
>(function MenuItem({ label, disabled, ...props }, forwardedRef) {
  const menu = React.useContext(MenuContext);
  const item = useCompositeListItem({ label: disabled ? null : label });
  const tree = useFloatingTree();
  const isActive = item.index === menu.activeIndex;
  const id = React.useId();

  return (
    <div
      {...props}
      id={id}
      ref={useForkRefN([item.ref, forwardedRef])}
      role="option"
      tabIndex={-1}
      aria-selected={isActive}
      aria-disabled={disabled}
      className={c(
        'focus:bg-red-500 flex cursor-default rounded px-2 py-1 text-left outline-none',
        { 'opacity-40': disabled, 'bg-red-500 text-white': isActive },
      )}
      {...menu.getItemProps({
        onClick(event: React.MouseEvent<HTMLButtonElement>) {
          props.onClick?.(event);
          tree?.events.emit('click');
        },
        onFocus(event: React.FocusEvent<HTMLButtonElement>) {
          props.onFocus?.(event);
          menu.setHasFocusInside(true);
        },
        onMouseEnter(event: React.MouseEvent<HTMLButtonElement>) {
          props.onMouseEnter?.(event);
          if (menu.allowHover && menu.isOpen) {
            menu.setActiveIndex(item.index);
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
            tree?.nodesRef.current[0].context?.elements.domReference?.closest('[role="menubar"]')
          ) {
            closeParents(menu.parent);
          }
        },
      })}
    >
      {label}
    </div>
  );
});

/** @internal */
export const Menu = React.forwardRef<
  HTMLButtonElement,
  MenuProps & React.HTMLProps<HTMLButtonElement>
>(function MenuWrapper(props, ref) {
  const parentId = useFloatingParentNodeId();

  if (parentId === null) {
    return (
      <FloatingTree>
        <MenuComponent {...props} ref={ref} />
      </FloatingTree>
    );
  }

  return <MenuComponent {...props} ref={ref} />;
});

/** @internal */
export function Main() {
  const virtualItemRef = React.useRef<HTMLElement | null>(null) as any;

  return (
    <React.Fragment>
      <h1 className="mb-8 text-5xl font-bold">Menu Virtual</h1>
      <div className="border-slate-400 mb-4 grid h-[20rem] place-items-center rounded border lg:w-[40rem]">
        <Menu label="Edit" virtualItemRef={virtualItemRef}>
          <MenuItem
            label="Undo"
            onClick={() => {
              // eslint-disable-next-line no-console
              return console.log('Undo');
            }}
          />
          <MenuItem label="Redo" />
          <MenuItem label="Cut" disabled />
          <Menu label="Copy as" virtualItemRef={virtualItemRef}>
            <MenuItem label="Text" />
            <MenuItem label="Video" />
            <Menu label="Image" virtualItemRef={virtualItemRef}>
              <MenuItem label=".png" />
              <MenuItem label=".jpg" />
              <MenuItem label=".svg" />
              <MenuItem label=".gif" />
            </Menu>
            <MenuItem label="Audio" />
          </Menu>
          <Menu label="Share" virtualItemRef={virtualItemRef}>
            <MenuItem label="Mail" />
            <MenuItem label="Instagram" />
          </Menu>
        </Menu>
      </div>
    </React.Fragment>
  );
}
