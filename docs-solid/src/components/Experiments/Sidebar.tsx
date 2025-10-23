import clsx from 'clsx';
import { splitProps, type JSX } from 'solid-js';
import { EditPanel } from './EditPanel';
import { ExperimentsList } from './ExperimentsList';
import { HideSidebar } from './HideSidebar';
import { SettingsMetadata, SettingsPanel } from './SettingsPanel';
import classes from './Sidebar.module.css';

export function Sidebar(props: SidebarProps) {
  const [local, otherProps] = splitProps(props, ['experimentPath', 'settingsMetadata', 'class']);

  return (
    <div {...otherProps} class={clsx(classes.root, local.class)}>
      {local.experimentPath && (
        <>
          {local.settingsMetadata && (
            <SettingsPanel
              class={classes.panel}
              metadata={local.settingsMetadata}
              renderAsPopup={false}
            />
          )}
          <EditPanel class={classes.panel} experimentPath={local.experimentPath} />
          <HideSidebar class={classes.panel} />
        </>
      )}
      <ExperimentsList class={classes.panel} />
    </div>
  );
}

interface SidebarProps extends JSX.HTMLAttributes<HTMLDivElement> {
  experimentPath?: string;
  settingsMetadata?: SettingsMetadata<unknown>;
}
