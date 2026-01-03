import clsx from 'clsx';
import { splitProps, type ComponentProps } from 'solid-js';

export function Root(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <div class={clsx('TableRoot', local.class)} {...rest}>
      <table class="TableRootTable">{local.children}</table>
    </div>
  );
}

export function Head(props: ComponentProps<'thead'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <thead class={clsx('TableHead', local.class)} {...rest} />;
}

export function Body(props: ComponentProps<'tbody'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <tbody class={clsx('TableBody', local.class)} {...rest} />;
}

export function Row(props: ComponentProps<'tr'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <tr class={clsx('TableRow', local.class)} {...rest} />;
}

export function ColumnHeader(props: Omit<ComponentProps<'th'>, 'scope'>) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <th scope="col" class={clsx('TableColumnHeader', local.class)} {...rest}>
      <span class="TableCellInner">{local.children}</span>
    </th>
  );
}

export function RowHeader(props: Omit<ComponentProps<'th'>, 'scope'>) {
  const [local] = splitProps(props, ['class', 'children']);
  return (
    <th scope="row" ref={observeInnerScrollable} class={clsx('TableCell', local.class)} {...props}>
      <span class="TableCellInner">{local.children}</span>
    </th>
  );
}

export function Cell(props: ComponentProps<'td'>) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <td ref={observeInnerScrollable} class={clsx('TableCell', local.class)} {...rest}>
      <span class="TableCellInner">{local.children}</span>
    </td>
  );
}

// Observe whether the "TableCellInner" node is scrollable and set a "[data-scrollable]"
// attribute on the parent cell. We are rawdogging the DOM changes here to skip unnecessary renders.
function observeInnerScrollable(node: HTMLElement | null) {
  if (!node) {
    return;
  }

  const inner = node.children[0] as HTMLElement;
  const observer = new ResizeObserver(() => {
    if (inner.scrollWidth > inner.offsetWidth) {
      node.setAttribute('data-scrollable', '');
    } else {
      node.removeAttribute('data-scrollable');
    }
  });

  if (inner) {
    observer.observe(inner);
  } else {
    console.warn('Expected to find a TableCellInner element');
  }
}
