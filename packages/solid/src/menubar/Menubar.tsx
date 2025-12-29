'use client';
import { createSignal, onCleanup, onMount, type ParentProps } from 'solid-js';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import {
  FloatingNode,
  FloatingTree,
  useFloatingNodeId,
  useFloatingTree,
} from '../floating-ui-solid';
import { type MenuRoot } from '../menu/root/MenuRoot';
import { splitComponentProps } from '../solid-helpers';
import { useScrollLock } from '../utils';
import { BaseUIComponentProps } from '../utils/types';
import { AnimationFrame } from '../utils/useAnimationFrame';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useRenderElement } from '../utils/useRenderElementV2';
import { MenubarContext, useMenubarContext } from './MenubarContext';

/**
 * The container for menus.
 *
 * Documentation: [Base UI Menubar](https://base-ui.com/react/components/menubar)
 */
export function Menubar(props: Menubar.Props) {
  const [, local, otherProps] = splitComponentProps(props, ['orientation', 'loop', 'modal', 'id']);
  const orientation = () => local.orientation ?? 'horizontal';
  const loop = () => local.loop ?? true;
  const modal = () => local.modal ?? true;

  const [contentElement, setContentElement] = createSignal<HTMLElement | null | undefined>();
  const [hasSubmenuOpen, setHasSubmenuOpen] = createSignal(false);
  const [allowMouseUpTriggerRef, setAllowMouseUpTriggerRef] = createSignal(false);

  useScrollLock({
    enabled: () => modal() && hasSubmenuOpen(),
    open: hasSubmenuOpen,
    mounted: hasSubmenuOpen,
    referenceElement: contentElement,
  });

  const id = useBaseUiId(() => local.id);

  const state: Menubar.State = {
    get orientation() {
      return orientation();
    },
    get modal() {
      return modal();
    },
  };

  const context: MenubarContext = {
    contentElement,
    setContentElement,
    setHasSubmenuOpen,
    hasSubmenuOpen,
    modal,
    orientation,
    rootId: id,
    allowMouseUpTriggerRef,
    setAllowMouseUpTriggerRef,
  };

  const element = useRenderElement('div', props, {
    state,
    ref: setContentElement,
    props: [
      {
        role: 'menubar',
        get id() {
          return id();
        },
      },
      otherProps,
    ],
  });

  return (
    <MenubarContext.Provider value={context}>
      <FloatingTree>
        <MenubarContent>
          <CompositeRoot
            render={element}
            orientation={orientation()}
            loop={loop()}
            highlightItemOnHover={hasSubmenuOpen()}
          />
        </MenubarContent>
      </FloatingTree>
    </MenubarContext.Provider>
  );
}

function MenubarContent(props: ParentProps) {
  const nodeId = useFloatingNodeId();
  const { events: menuEvents } = useFloatingTree()!;
  const openSubmenusRef = new Set<string>();
  const rootContext = useMenubarContext();

  function onSubmenuOpenChange(event: { open: boolean; nodeId: string; parentNodeId: string }) {
    if (event.parentNodeId !== nodeId()) {
      return;
    }

    if (event.open) {
      openSubmenusRef.add(event.nodeId);
    } else {
      openSubmenusRef.delete(event.nodeId);
    }

    const isAnyOpen = openSubmenusRef.size > 0;
    if (isAnyOpen) {
      rootContext.setHasSubmenuOpen(true);
    } else if (rootContext.hasSubmenuOpen()) {
      // wait for the next frame to set the state to make sure another menu doesn't open
      // immediately after the previous one is closed
      AnimationFrame.request(() => {
        if (openSubmenusRef.size === 0) {
          rootContext.setHasSubmenuOpen(false);
        }
      });
    }
  }

  onMount(() => {
    menuEvents.on('openchange', onSubmenuOpenChange);
    onCleanup(() => {
      menuEvents.off('openchange', onSubmenuOpenChange);
    });
  });

  return <FloatingNode id={nodeId()}>{props.children}</FloatingNode>;
}

export namespace Menubar {
  export interface State {}
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the menubar is modal.
     * @default true
     */
    modal?: boolean;
    /**
     * Whether the whole menubar is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * The orientation of the menubar.
     * @default 'horizontal'
     */
    orientation?: MenuRoot.Orientation;
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
     * @default true
     */
    loop?: boolean;
  }
}
