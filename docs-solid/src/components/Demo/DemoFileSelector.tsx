import { Tabs } from '@base-ui-components/solid/tabs';
import { DemoContext } from 'docs-solid/src/blocks/Demo';
import { batch, For, Show, useContext } from 'solid-js';

interface DemoFileSelectorProps {
  onTabChange?: () => void;
}

export function DemoFileSelector(props: DemoFileSelectorProps) {
  const demoContext = useContext(DemoContext);
  if (!demoContext) {
    throw new Error('Missing DemoContext');
  }

  const { selectedVariant, setSelectedFile, selectedFile } = demoContext;

  return (
    <Show
      when={selectedVariant().files.length > 1}
      fallback={<div class="DemoFilename">{selectedVariant().files[0].name}</div>}
    >
      <Tabs.Root
        value={selectedFile}
        onValueChange={(value) => {
          batch(() => {
            setSelectedFile(value);
            props.onTabChange?.();
          });
        }}
      >
        <Tabs.List class="DemoTabsList" aria-label="Files">
          <For each={selectedVariant().files}>
            {(file) => (
              <Tabs.Tab class="DemoTab" value={file}>
                {file.name}
              </Tabs.Tab>
            )}
          </For>
        </Tabs.List>
      </Tabs.Root>
    </Show>
  );
}
