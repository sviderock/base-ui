import { createAsync, query } from '@solidjs/router';
import { inlineMdxComponents } from 'docs-solid/src/mdx-components';
import { createMdxComponent } from 'docs-solid/src/mdx/createMdxComponent';
import { rehypeSyntaxHighlighting } from 'docs-solid/src/syntax-highlighting';
import type { MDXContent } from 'mdx/types';
import { For, splitProps, type ComponentProps } from 'solid-js';
import Table from '../Table';
import { TableCode } from '../TableCode';
import { ReferenceTablePopover } from './ReferenceTablePopover';
import type { AttributeDef } from './types';

interface Item {
  name: string;
  attribute: AttributeDef;
  AttributeDescription: MDXContent;
}

interface AttributesReferenceTableProps extends ComponentProps<typeof Table.Root> {
  data: Record<string, AttributeDef>;
}

export function AttributesReferenceTable(props: AttributesReferenceTableProps) {
  const [local, rest] = splitProps(props, ['data']);
  const items = createAsync(() => getItems(local.data), { initialValue: [] });

  return (
    <Table.Root {...rest}>
      <Table.Head>
        <Table.Row>
          <Table.ColumnHeader class="w-full xs:w-48 sm:w-56 md:w-1/3">Attribute</Table.ColumnHeader>
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
                  <Item.AttributeDescription />
                </div>
                <div class="contents xs:hidden">
                  <ReferenceTablePopover>
                    <Item.AttributeDescription />
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

const getItems = query(async (data: Record<string, AttributeDef>) => {
  const newItems: Item[] = [];
  for (const name of Object.keys(data)) {
    const attribute = data[name];
    const AttributeDescription = await createMdxComponent(attribute.description, {
      rehypePlugins: rehypeSyntaxHighlighting,
      useMDXComponents: () => inlineMdxComponents,
    });

    newItems.push({ name, attribute, AttributeDescription });
  }
  return newItems;
}, 'reference-table-attributes');
