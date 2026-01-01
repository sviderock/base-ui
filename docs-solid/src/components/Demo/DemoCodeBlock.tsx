import { Collapsible } from '@base-ui-components/solid/collapsible';
import * as BaseDemo from 'docs-solid/src/blocks/Demo';
import { Show, useContext, type ComponentProps } from 'solid-js';
import * as ScrollArea from '../ScrollArea';

interface DemoCodeBlockProps {
  collapsibleOpen: boolean;
  /** How many lines should the code block have to get collapsed instead of rendering fully */
  collapsibleLinesThreshold?: number;
  /** When compact, we don't show a preview of the collapse code */
  compact: boolean;
}

function Root(props: ComponentProps<typeof ScrollArea.Root>) {
  return (
    <ScrollArea.Root
      {...props}
      class="DemoCodeBlockRoot"
      tabIndex={-1}
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
    />
  );
}

export function DemoCodeBlock(props: DemoCodeBlockProps) {
  const collapsibleLinesThreshold = () => props.collapsibleLinesThreshold ?? 12;
  const demoContext = useContext(BaseDemo.DemoContext);

  if (!demoContext) {
    throw new Error('Demo.Playground must be used within a Demo.Root');
  }

  const { selectedFile } = demoContext;
  const lineBreaks = () => selectedFile().content.match(/\n/g) ?? [];

  return (
    <Show
      when={lineBreaks().length < collapsibleLinesThreshold()}
      fallback={
        <>
          <Root
            render={(p) => (
              <Collapsible.Panel
                {...p}
                keepMounted={props.compact ? undefined : true}
                hidden={props.compact ? undefined : false}
              />
            )}
          >
            <ScrollArea.Viewport
              aria-hidden={!props.collapsibleOpen}
              data-closed={props.collapsibleOpen ? undefined : ''}
              class="DemoCodeBlockViewport"
              {...(!props.collapsibleOpen && {
                tabIndex: undefined,
                style: { overflow: undefined },
              })}
            >
              <BaseDemo.SourceBrowser class="DemoSourceBrowser" />
            </ScrollArea.Viewport>

            {props.collapsibleOpen && (
              <>
                <ScrollArea.Corner />
                <ScrollArea.Scrollbar orientation="vertical" />
                <ScrollArea.Scrollbar orientation="horizontal" />
              </>
            )}
          </Root>

          <Collapsible.Trigger class="DemoCollapseButton">
            {props.collapsibleOpen ? 'Hide' : 'Show'} code
          </Collapsible.Trigger>
        </>
      }
    >
      <Root>
        <ScrollArea.Viewport>
          <BaseDemo.SourceBrowser class="DemoSourceBrowser" />
        </ScrollArea.Viewport>
        <ScrollArea.Corner />
        <ScrollArea.Scrollbar orientation="vertical" />
        <ScrollArea.Scrollbar orientation="horizontal" />
      </Root>
    </Show>
  );
}
