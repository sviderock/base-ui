import { createAsync } from '@solidjs/router';
import { getDependencyFiles } from 'docs-solid/src/components/Demo/DemoLoader';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Show, splitProps, Suspense, type JSX } from 'solid-js';
import { SandboxLink } from './SandboxLink';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

export function EditPanel(props: EditPanelProps) {
  const [local, otherProps] = splitProps(props, ['experimentPath']);

  const dependencies = createAsync(() =>
    getDependencyFiles(
      [local.experimentPath, resolve(currentDirectory, './SettingsPanel.tsx')],
      true,
    ),
  );

  return (
    <Suspense>
      <div {...otherProps}>
        <h2>Edit</h2>
        <Show when={dependencies()}>
          <SandboxLink files={dependencies()!}>
            Open in CodeSandbox ({local.experimentPath})
          </SandboxLink>
        </Show>
      </div>
    </Suspense>
  );
}

interface EditPanelProps extends JSX.HTMLAttributes<HTMLDivElement> {
  experimentPath: string;
}
