import { createCodeSandbox } from 'docs-solid/src/blocks/createCodeSandbox/createCodeSandbox';
import { DemoFile } from 'docs-solid/src/blocks/Demo';
import { splitProps, type JSX } from 'solid-js';
import { resolveDependencies } from '../Demo/CodeSandboxLink';
import { Button } from './Button';

export function SandboxLink(props: SandboxLinkProps) {
  const [local, otherProps] = splitProps(props, ['files']);

  const handleClick = () => {
    createCodeSandbox({
      demoFiles: local.files,
      demoLanguage: 'ts',
      title: 'Base UI experiment',
      dependencies: {
        'solid-js': '^1.9.7',
      },
      dependencyResolver: resolveDependencies,
      customIndexFile: indexTs,
    });
  };

  return (
    <Button {...otherProps} onClick={handleClick} variant="text" fullWidth>
      Open in CodeSandbox
    </Button>
  );
}

const indexTs = `import { render } from 'solid-js/web;;
import Experiment, { settingsMetadata } from './App';
import { SettingsPanel, ExperimentSettingsProvider } from './SettingsPanel';

render(
  () => (
    (
      <ExperimentSettingsProvider metadata={settingsMetadata}>
        <Experiment />
        <SettingsPanel metadata={settingsMetadata} />
      </ExperimentSettingsProvider>
    ),
    root!
  ),
);`;

interface SandboxLinkProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  files: DemoFile[];
}
