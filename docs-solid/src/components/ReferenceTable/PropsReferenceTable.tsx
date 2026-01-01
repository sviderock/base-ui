import { createAsync, query } from '@solidjs/router';
import { inlineMdxComponents } from 'docs-solid/src/mdx-components';
import { createMdxComponent } from 'docs-solid/src/mdx/createMdxComponent';
import { rehypeSyntaxHighlighting } from 'docs-solid/src/syntax-highlighting';
import type { MDXContent } from 'mdx/types';
import { For, splitProps, type ComponentProps } from 'solid-js';
import * as Table from '../Table';
import { TableCode } from '../TableCode';
import { ReferenceTablePopover } from './ReferenceTablePopover';
import type { PropDef } from './types';

interface Item {
  name: string;
  prop: PropDef;
  PropType: MDXContent;
  PropDefault: MDXContent;
  PropDescription: MDXContent;
}

interface PropsReferenceTableProps extends ComponentProps<typeof Table.Root> {
  data: Record<string, PropDef>;
  type?: 'props' | 'return';
}

export function PropsReferenceTable(props: PropsReferenceTableProps) {
  const [local, rest] = splitProps(props, ['data', 'type']);
  const type = () => local.type ?? 'props';
  const items = createAsync(() => getItems(local.data), { initialValue: [] });

  return (
    <Table.Root {...rest}>
      <Table.Head>
        <Table.Row>
          <Table.ColumnHeader class="w-full xs:w-48 sm:w-56 md:w-1/3">Prop</Table.ColumnHeader>
          <Table.ColumnHeader
            class={
              type() === 'props'
                ? 'max-xs:hidden xs:w-full md:w-7/15'
                : 'max-xs:hidden xs:w-full md:w-full'
            }
          >
            Type
          </Table.ColumnHeader>
          {type() === 'props' && (
            <Table.ColumnHeader class="max-md:hidden md:w-1/5">Default</Table.ColumnHeader>
          )}
          <Table.ColumnHeader class="w-10" aria-label="Description" />
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <For each={items()}>
          {(Item) => (
            <Table.Row>
              <Table.RowHeader>
                <TableCode class="text-navy">
                  {Item.name}
                  {Item.prop.required ? <sup class="top-[-0.3em] text-xs text-red-800">*</sup> : ''}
                </TableCode>
              </Table.RowHeader>
              <Table.Cell class="max-xs:hidden">
                <Item.PropType />
              </Table.Cell>
              {type() === 'props' && (
                <Table.Cell class="max-md:hidden">
                  <Item.PropDefault />
                </Table.Cell>
              )}
              <Table.Cell>
                {Item.prop.description && (
                  <ReferenceTablePopover>
                    <Item.PropDescription />
                    <div class="flex flex-col gap-2 text-md md:hidden">
                      <div class="border-t border-gray-200 pt-2 xs:hidden">
                        <div class="mb-1 font-bold">Type</div>
                        <Item.PropType />
                      </div>
                      {type() === 'props' && (
                        <div class="border-t border-gray-200 pt-2">
                          <div class="mb-1 font-bold">Default</div>
                          <Item.PropDefault />
                        </div>
                      )}
                    </div>
                  </ReferenceTablePopover>
                )}
              </Table.Cell>
            </Table.Row>
          )}
        </For>
      </Table.Body>
    </Table.Root>
  );
}

const getItems = query(async (data: Record<string, PropDef>) => {
  const newItems: Item[] = [];
  for (const name of Object.keys(data)) {
    const prop = data[name];
    const PropType = await createMdxComponent(`\`${prop.type}\``, {
      rehypePlugins: rehypeSyntaxHighlighting,
      useMDXComponents: () => ({ code: TableCode }),
    });

    const PropDefault = await createMdxComponent(`\`${prop.required ? '—' : prop.default}\``, {
      rehypePlugins: rehypeSyntaxHighlighting,
      useMDXComponents: () => ({ code: TableCode }),
    });

    const PropDescription = await createMdxComponent(prop.description, {
      rehypePlugins: rehypeSyntaxHighlighting,
      useMDXComponents: () => inlineMdxComponents,
    });

    newItems.push({ name, prop, PropType, PropDefault, PropDescription });
  }

  return newItems;
}, 'reference-table-props');
