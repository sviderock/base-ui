import clsx from 'clsx';
import { children, createMemo, splitProps, type ComponentProps, type JSX } from 'solid-js';
import { getChildrenText } from '../utils/getChildrenText';
import { Code } from './Code';

interface TableCodeProps extends ComponentProps<'code'> {
  printWidth?: number;
}

/** An inline code component that breaks long union types into multiple lines */
export function TableCode(props: TableCodeProps) {
  const [local, rest] = splitProps(props, ['class', 'children', 'printWidth']);
  const printWidth = () => local.printWidth ?? 40;
  const text = () => getChildrenText(local.children);
  const safeChildren = children(() => local.children);
  const resolvedChildren = createMemo(() => {
    if (text().includes('|') && text().length > printWidth()) {
      const unionGroups: JSX.Element[][] = [];
      const parts = safeChildren.toArray();

      let depth = 0;
      let groupIndex = 0;
      parts.forEach((child, index) => {
        if (index === 0) {
          unionGroups.push([]);
        }

        const str = getChildrenText(child);

        // Solo function return values shouldn't be broken up, e.g. in:
        // `(value) => string | string[] | null | Promise`
        if (str.includes('=>') && depth < 1) {
          depth += 1;
        }

        if (str.trim() === '|' && depth < 1 && index !== 0) {
          unionGroups.push([]);
          groupIndex += 1;
          return;
        }

        str.split('(').forEach(() => {
          depth += 1;
        });

        str.split(')').forEach(() => {
          depth -= 1;
        });

        unionGroups[groupIndex].push(child);
      });

      if (unionGroups.length > 1) {
        unionGroups.forEach((_, index) => {
          const pipe = <span style={{ color: 'var(--syntax-keyword)' }}>| </span>;
          const pipeWithNewline = (
            <>
              <br />
              {pipe}
            </>
          );

          const element = index === 0 ? pipe : pipeWithNewline;
          unionGroups.splice(index * 2, 0, [element]);
        });
      }

      return unionGroups.flat();
    }

    return safeChildren();
  });

  return (
    <Code data-table-code="" class={clsx('text-xs', local.class)} {...rest}>
      {resolvedChildren()}
    </Code>
  );
}
