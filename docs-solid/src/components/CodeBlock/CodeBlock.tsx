import { useId } from '@base-ui-components/solid/utils';
import copy from 'clipboard-copy';
import clsx from 'clsx';
import {
  createContext,
  createSignal,
  splitProps,
  useContext,
  type Accessor,
  type ComponentProps,
} from 'solid-js';
import { CheckIcon } from '../../icons/CheckIcon';
import { CopyIcon } from '../../icons/CopyIcon';
import { GhostButton } from '../GhostButton';
import * as ScrollArea from '../ScrollArea';

const CodeBlockContext = createContext<{
  codeId: Accessor<string | undefined>;
  titleId: Accessor<string | undefined>;
}>({
  codeId: () => '',
  titleId: () => '',
});

export function Root(props: Omit<ComponentProps<'div'>, 'ref'>) {
  const [local, rest] = splitProps(props, ['class']);
  const titleId = useId();
  const codeId = useId();
  const context = { codeId, titleId };

  return (
    <CodeBlockContext.Provider value={context}>
      <div
        role="figure"
        aria-labelledby={titleId()}
        class={clsx('CodeBlockRoot', local.class)}
        {...rest}
      />
    </CodeBlockContext.Provider>
  );
}

export function Panel(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  const { codeId, titleId } = useContext(CodeBlockContext);
  const [copyTimeout, setCopyTimeout] = createSignal(0);

  return (
    <div class={clsx('CodeBlockPanel', local.class)} {...rest}>
      <div id={titleId()} class="CodeBlockPanelTitle">
        {local.children}
      </div>
      <GhostButton
        class="ml-auto"
        aria-label="Copy code"
        onClick={async () => {
          const code = document.getElementById(codeId()!)?.textContent;

          if (code) {
            await copy(code);
            /* eslint-disable no-restricted-syntax */
            const newTimeout = window.setTimeout(() => {
              window.clearTimeout(newTimeout);
              setCopyTimeout(0);
            }, 2000);
            window.clearTimeout(copyTimeout());
            setCopyTimeout(newTimeout);
            /* eslint-enable no-restricted-syntax */
          }
        }}
      >
        Copy
        <span class="flex size-[14px] items-center justify-center">
          {copyTimeout() ? <CheckIcon /> : <CopyIcon />}
        </span>
      </GhostButton>
    </div>
  );
}

export function Pre(props: ComponentProps<'pre'>) {
  const [local, rest] = splitProps(props, ['class']);
  const { codeId } = useContext(CodeBlockContext);
  return (
    <ScrollArea.Root
      // Select code block contents on Ctrl/Cmd + A
      tabIndex={-1}
      class="CodeBlockPreContainer"
      onKeyDown={(event) => {
        if (
          event.key === 'a' &&
          (event.metaKey || event.ctrlKey) &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          window.getSelection()?.selectAllChildren(event.currentTarget);
        }
      }}
    >
      <ScrollArea.Viewport
        style={{ overflow: undefined }}
        render={(p) => (
          <pre {...rest} id={codeId()} class={clsx('CodeBlockPre', local.class)} {...p} />
        )}
      />
      <ScrollArea.Scrollbar orientation="horizontal" />
    </ScrollArea.Root>
  );
}
