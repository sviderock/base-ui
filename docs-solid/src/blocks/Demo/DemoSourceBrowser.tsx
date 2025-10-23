'use client';
import { combineStyle } from '@solid-primitives/props';
import clsx from 'clsx';
import camelCase from 'lodash/camelCase';
import { Show, useContext, type ComponentProps } from 'solid-js';
import { DemoContext } from './DemoContext';

export function DemoSourceBrowser(props: ComponentProps<'pre'>) {
  const demoContext = useContext(DemoContext);
  if (!demoContext) {
    throw new Error('Demo.Playground must be used within a Demo.Root');
  }

  const { selectedFile } = demoContext;

  return (
    <Show
      when={selectedFile().prettyContent != null}
      fallback={
        <pre ref={props.ref}>
          <code>{selectedFile().content}</code>
        </pre>
      }
    >
      {(_) => {
        // Unwrap the incoming `<pre>` and parse out its attributes to put on the node we own
        const [, pre, code] = selectedFile().prettyContent!.match(/(<pre.+?>)(.+)<\/pre>/s) ?? [];

        if (!pre || !code) {
          throw new Error('Couldn’t parse prettyContent');
        }

        const [, className = ''] = pre.match(/class="(.+?)"/) ?? [];
        const [, styleAttr = ''] = pre.match(/style="(.+?)"/) ?? [];
        const style = Object.fromEntries(
          styleAttr
            .split(';')
            .map((str) => str.split(':').map(([key, value]) => [camelCase(key), value])),
        );

        return (
          <pre
            {...props}
            ref={props.ref}
            data-language={selectedFile().type}
            class={clsx(className, props.class)}
            style={combineStyle(style, props.style)}
            innerHTML={code}
          />
        );
      }}
    </Show>
  );
}

export namespace DemoSourceBrowser {}
