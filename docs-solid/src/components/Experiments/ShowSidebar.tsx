'use client';
import { useContext } from 'solid-js';
import { ExperimentRootContext } from './ExperimentRoot';
import classes from './ShowSidebar.module.css';

export function ShowSidebar() {
  const rootContext = useContext(ExperimentRootContext);
  if (!rootContext) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => rootContext.setSidebarVisible(true)}
      class={classes.root}
      title="Show sidebar"
      aria-label="Show sidebar"
    />
  );
}
