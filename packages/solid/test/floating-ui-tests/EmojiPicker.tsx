import c from 'clsx';
import { createEffect, createSignal, For, Match, splitProps, Switch, type JSX } from 'solid-js';
import {
  arrow,
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
} from '../../src/floating-ui-solid';
import type { Placement } from '../../src/floating-ui-solid/types';
import { useId } from '../../src/utils/useId';
import { Button } from './Button';

const emojis = [
  {
    name: 'apple',
    emoji: '🍎',
  },
  {
    name: 'orange',
    emoji: '🍊',
  },
  {
    name: 'watermelon',
    emoji: '🍉',
  },
  {
    name: 'strawberry',
    emoji: '🍓',
  },
  {
    name: 'pear',
    emoji: '🍐',
  },
  {
    name: 'banana',
    emoji: '🍌',
  },
  {
    name: 'pineapple',
    emoji: '🍍',
  },
  {
    name: 'cherry',
    emoji: '🍒',
  },
  {
    name: 'peach',
    emoji: '🍑',
  },
];

type OptionProps = JSX.HTMLAttributes<HTMLButtonElement> & {
  name: string;
  active: boolean;
  selected: boolean;
  children: JSX.Element;
};

/** @internal */
function Option(props: OptionProps) {
  const [local, others] = splitProps(props, ['name', 'active', 'selected', 'children']);
  const id = useId();
  return (
    <button
      {...others}
      id={id()}
      role="option"
      class={c('aspect-square cursor-default rounded text-center text-3xl select-none', {
        'bg-cyan-100': local.selected && !local.active,
        'bg-cyan-200': local.active,
        'opacity-40': local.name === 'orange',
      })}
      aria-selected={local.selected}
      disabled={local.name === 'orange'}
      aria-label={local.name}
      tabIndex={-1}
      data-active={local.active ? '' : undefined}
      type="button"
    >
      {local.children}
    </button>
  );
}

/** @internal */
export function Main() {
  const [open, setOpen] = createSignal(false);
  const [search, setSearch] = createSignal('');
  const [selectedEmoji, setSelectedEmoji] = createSignal<string | null>(null);
  const [activeIndex, setActiveIndex] = createSignal<number | null>(null);
  const [placement, setPlacement] = createSignal<Placement | null>(null);

  let arrowRef: Element | null = null;

  const listRef: Array<HTMLElement | null> = [];

  const noResultsId = useId();

  const {
    floatingStyles,
    refs,
    context,
    placement: resultantPlacement,
  } = useFloating({
    placement: () => placement() ?? 'bottom-start',
    open,
    onOpenChange: setOpen,
    // We don't want flipping to occur while searching, as the floating element
    // will resize and cause disorientation.
    middleware: () => [
      offset(8),
      ...(placement() ? [] : [flip()]),
      arrow({
        element: arrowRef!,
        padding: 20,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Handles opening the floating element via the Choose Emoji button.
  const { getReferenceProps, getFloatingProps } = useInteractions(() => [
    useClick(context)(),
    useDismiss(context)(),
    useRole(context, { role: () => 'menu' })(),
  ]);

  // Handles the list navigation where the reference is the inner input, not
  // the button that opens the floating element.
  const {
    getReferenceProps: getInputProps,
    getFloatingProps: getListFloatingProps,
    getItemProps,
  } = useInteractions(() => [
    useListNavigation(context, {
      listRef: () => listRef,
      onNavigate: open() ? setActiveIndex : undefined,
      activeIndex,
      cols: () => 3,
      orientation: () => 'horizontal',
      loop: () => true,
      focusItemOnOpen: () => false,
      virtual: () => true,
      allowEscape: () => true,
    })(),
  ]);

  createEffect(() => {
    if (open()) {
      setPlacement(resultantPlacement());
    } else {
      setSearch('');
      setActiveIndex(null);
      setPlacement(null);
    }
  });

  const handleEmojiClick = () => {
    if (activeIndex() !== null) {
      // eslint-disable-next-line
      setSelectedEmoji(filteredEmojis()[activeIndex()!].emoji);
      setOpen(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleEmojiClick();
    }
  };

  const filteredEmojis = () =>
    emojis.filter(({ name }) => name.toLocaleLowerCase().includes(search().toLocaleLowerCase()));

  return (
    <>
      <h1 class="mb-8 text-5xl font-bold">Emoji Picker</h1>
      <div class="border-slate-400 mb-4 grid h-[20rem] place-items-center rounded border lg:w-[40rem]">
        <div class="text-center">
          <Button
            ref={refs.setReference}
            class="text-2xl"
            aria-label="Choose emoji"
            aria-describedby="emoji-label"
            data-open={open() ? '' : undefined}
            {...getReferenceProps()}
          >
            ☻
          </Button>
          <br />
          {selectedEmoji && (
            <span id="emoji-label">
              <span
                style={{ 'font-size': '30px' }}
                aria-label={emojis.find(({ emoji }) => emoji === selectedEmoji())?.name}
              >
                {selectedEmoji()}
              </span>{' '}
              selected
            </span>
          )}
          <FloatingPortal>
            {open() && (
              <FloatingFocusManager context={context} modal={false}>
                <div
                  ref={refs.setFloating}
                  class="border-slate-900/10 rounded-lg border bg-white/70 bg-clip-padding p-4 shadow-md backdrop-blur-sm"
                  style={floatingStyles()}
                  {...getFloatingProps(getListFloatingProps())}
                >
                  <span class="text-sm uppercase opacity-40">Emoji Picker</span>
                  <input
                    class="border-slate-300 focus:border-blue-600 my-2 block w-36 rounded border p-1 outline-none"
                    placeholder="Search emoji"
                    value={search()}
                    aria-controls={filteredEmojis().length === 0 ? noResultsId() : undefined}
                    {...getInputProps<HTMLInputElement>({
                      onChange(event) {
                        setActiveIndex(null);
                        setSearch(event.target.value);
                      },
                      onKeyDown: handleKeyDown,
                    })}
                  />
                  <Switch>
                    <Match when={filteredEmojis().length === 0}>
                      <p id={noResultsId()} role="region" aria-atomic="true" aria-live="assertive">
                        No results.
                      </p>
                    </Match>
                    <Match when={filteredEmojis().length > 0}>
                      <div class="grid grid-cols-3" role="listbox">
                        <For each={filteredEmojis()}>
                          {(item, index) => (
                            <Option
                              name={item.name}
                              ref={(node) => {
                                listRef[index()] = node;
                              }}
                              selected={selectedEmoji() === item.emoji}
                              active={activeIndex() === index()}
                              {...getItemProps({
                                onClick: handleEmojiClick,
                              })}
                            >
                              {item.emoji}
                            </Option>
                          )}
                        </For>
                      </div>
                    </Match>
                  </Switch>
                </div>
              </FloatingFocusManager>
            )}
          </FloatingPortal>
        </div>
      </div>
    </>
  );
}
