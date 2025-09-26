'use server';
import { inlineMdxComponents } from 'docs-solid/src/mdx-components';
import { createMdxComponent } from 'docs-solid/src/mdx/createMdxComponent';
import { rehypeSyntaxHighlighting } from 'docs-solid/src/syntax-highlighting';
import type { MDXContent } from 'mdx/types';
import { createSignal, For, onMount, splitProps, type ComponentProps } from 'solid-js';
import Table from '../Table';
import { TableCode } from '../TableCode';
import { ReferenceTablePopover } from './ReferenceTablePopover';
import type { CssVariableDef } from './types';

interface CssVariablesReferenceTableProps extends ComponentProps<typeof Table.Root> {
  data: Record<string, CssVariableDef>;
}

export function CssVariablesReferenceTable(props: CssVariablesReferenceTableProps) {
  const [local, rest] = splitProps(props, ['data']);
  const [items, setItems] = createSignal<
    { name: string; cssVariable: CssVariableDef; CssVaribleDescription: MDXContent }[]
  >([]);

  onMount(async () => {
    const newItems: ReturnType<typeof items> = [];
    for (const name of Object.keys(local.data)) {
      const cssVariable = local.data[name];
      const CssVaribleDescription = await createMdxComponent(cssVariable.description, {
        rehypePlugins: rehypeSyntaxHighlighting,
        useMDXComponents: () => inlineMdxComponents,
      });

      newItems.push({ name, cssVariable, CssVaribleDescription });
    }

    setItems(newItems);
  });

  return (
    <Table.Root {...rest}>
      <Table.Head>
        <Table.Row>
          <Table.ColumnHeader class="w-full xs:w-48 sm:w-56 md:w-1/3">
            CSS Variable
          </Table.ColumnHeader>
          <Table.ColumnHeader class="w-10 xs:w-2/3">
            <div class="sr-only xs:not-sr-only xs:contents">Description</div>
          </Table.ColumnHeader>
          {/* A cell to maintain a layout consistent with the props table */}
          <Table.ColumnHeader class="w-10 max-xs:hidden" aria-hidden role="presentation" />
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <For each={items()}>
          {(Item) => (
            <Table.Row>
              <Table.RowHeader>
                <TableCode class="text-navy">{Item.name}</TableCode>
              </Table.RowHeader>
              <Table.Cell colSpan={2}>
                <div class="hidden xs:contents">
                  <Item.CssVaribleDescription />
                </div>
                <div class="contents xs:hidden">
                  <ReferenceTablePopover>
                    <Item.CssVaribleDescription />
                  </ReferenceTablePopover>
                </div>
              </Table.Cell>
            </Table.Row>
          )}
        </For>
      </Table.Body>
    </Table.Root>
  );
}
