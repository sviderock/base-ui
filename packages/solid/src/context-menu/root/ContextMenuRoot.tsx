'use client';
import { Menu } from '../../menu';
import { MenuRootContext } from '../../menu/root/MenuRootContext';
import { useId } from '../../utils/useId';
import { ContextMenuRootContext } from './ContextMenuRootContext';

/**
 * A component that creates a context menu activated by right clicking or long pressing.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
export function ContextMenuRoot(props: ContextMenuRoot.Props) {
  const anchor: ContextMenuRootContext['anchor'] = {
    getBoundingClientRect() {
      return DOMRect.fromRect({ width: 0, height: 0, x: 0, y: 0 });
    },
  };

  const refs: ContextMenuRootContext['refs'] = {
    backdropRef: null,
    internalBackdropRef: null,
    actionsRef: null,
    positionerRef: null,
    allowMouseUpTriggerRef: true,
  };

  const id = useId();

  const contextValue: ContextMenuRootContext = {
    anchor,
    refs,
    rootId: id,
  };

  return (
    <ContextMenuRootContext.Provider value={contextValue}>
      <MenuRootContext.Provider value={undefined}>
        <Menu.Root {...props} />
      </MenuRootContext.Provider>
    </ContextMenuRootContext.Provider>
  );
}

export namespace ContextMenuRoot {
  export interface State {}

  export interface Props
    extends Omit<Menu.Root.Props, 'modal' | 'openOnHover' | 'delay' | 'closeDelay'> {}
}
