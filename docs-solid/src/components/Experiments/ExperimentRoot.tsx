import clsx from 'clsx';
import { type Accessor, createContext, createSignal, type JSX, type Setter } from 'solid-js';
import classes from './ExperimentRoot.module.css';
import { ShowSidebar } from './ShowSidebar';

export interface ExperimentRootContext {
  sidebarVisible: Accessor<boolean>;
  setSidebarVisible: Setter<boolean>;
}

export const ExperimentRootContext = createContext<ExperimentRootContext | undefined>(undefined);

export function ExperimentRoot(props: ExperimentRootProps) {
  const [sidebarVisible, setSidebarVisible] = createSignal(true);

  const rootContext = {
    sidebarVisible,
    setSidebarVisible,
  };

  return (
    <ExperimentRootContext.Provider value={rootContext}>
      <div class={clsx(classes.root, sidebarVisible() && classes.withSidebar)}>
        {sidebarVisible() ? props.sidebar : <ShowSidebar />}
        <main class={classes.main}>{props.children}</main>
      </div>
    </ExperimentRootContext.Provider>
  );
}

export interface ExperimentRootProps {
  children: JSX.Element;
  sidebar?: JSX.Element;
}
