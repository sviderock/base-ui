import { combineStyle } from '@solid-primitives/props';
import { clientOnly } from '@solidjs/start';
import clsx from 'clsx';
import { createMemo, Show, useContext, type ComponentProps, type JSX } from 'solid-js';
import { DemoContext } from './DemoContext';

export const DemoSourceBrowser = clientOnly(async () => ({ default: _DemoSourceBrowser }), {
  lazy: true,
});

function _DemoSourceBrowser(props: ComponentProps<'pre'>) {
  const demoContext = useContext(DemoContext);
  if (!demoContext) {
    throw new Error('Demo.Playground must be used within a Demo.Root');
  }

  const { selectedFile } = demoContext;

  const fileContent = createMemo(() => {
    if (selectedFile().prettyContent == null) {
      return { content: selectedFile().content, class: '', style: '' };
    }

    // Unwrap the incoming `<pre>` and parse out its attributes to put on the node we own
    const [, pre, code] = selectedFile().prettyContent!.match(/(<pre.+?>)(.+)<\/pre>/s) ?? [];

    if (!pre || !code) {
      throw new Error('Couldn’t parse prettyContent');
    }

    const [, className = ''] = pre.match(/class="(.+?)"/) ?? [];
    const [, style = ''] = pre.match(/style="(.+?)"/) ?? [];

    return { content: code, class: className, style };
  });

  return (
    <Show
      when={selectedFile().prettyContent != null}
      fallback={
        <pre ref={props.ref}>
          <code>{fileContent().content}</code>
        </pre>
      }
    >
      <pre
        {...props}
        ref={props.ref}
        data-language={selectedFile().type}
        class={clsx(fileContent().class, props.class)}
        style={combineStyle(fileContent().style, props.style)}
        innerHTML={fileContent().content}
      />
    </Show>
  );
}

export namespace DemoSourceBrowser {}
