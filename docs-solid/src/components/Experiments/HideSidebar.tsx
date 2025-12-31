import { useContext, type JSX } from 'solid-js';
import { Button } from './Button';
import { ExperimentRootContext } from './ExperimentRoot';

export function HideSidebar(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const rootContext = useContext(ExperimentRootContext);
  if (!rootContext) {
    return null;
  }

  return (
    <div {...props}>
      <h2>Sidebar visibility</h2>
      <Button onClick={() => rootContext.setSidebarVisible(false)} variant="text" fullWidth>
        Hide sidebar
      </Button>
    </div>
  );
}
