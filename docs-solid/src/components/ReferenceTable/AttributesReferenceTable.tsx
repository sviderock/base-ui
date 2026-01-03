import { inlineMdxComponents } from 'docs-solid/src/mdx-components';
import { AsyncMDXComponent } from 'docs-solid/src/mdx/createMdxComponent';
import { rehypeSyntaxHighlighting } from 'docs-solid/src/syntax-highlighting';
import { For, splitProps, type ComponentProps } from 'solid-js';
import * as Table from '../Table';
import { TableCode } from '../TableCode';
import { ReferenceTablePopover } from './ReferenceTablePopover';
import type { AttributeDef } from './types';

interface AttributesReferenceTableProps extends ComponentProps<typeof Table.Root> {
  data: Record<string, AttributeDef>;
}

export function AttributesReferenceTable(props: AttributesReferenceTableProps) {
  const [local, rest] = splitProps(props, ['data']);
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
        <For each={Object.keys(local.data)}>
          {(name) => {
            return (
              <Table.Row>
                <Table.RowHeader>
                  <TableCode class="text-navy">{name}</TableCode>
                </Table.RowHeader>
                <Table.Cell colSpan={2}>
                  <div class="hidden xs:contents">
                    <AsyncMDXComponent
                      markdown={local.data[name].description}
                      options={{
                        rehypePlugins: rehypeSyntaxHighlighting,
                        useMDXComponents: () => inlineMdxComponents,
                      }}
                    />
                  </div>
                  <div class="contents xs:hidden">
                    <ReferenceTablePopover>
                      <AsyncMDXComponent
                        markdown={local.data[name].description}
                        options={{
                          rehypePlugins: rehypeSyntaxHighlighting,
                          useMDXComponents: () => inlineMdxComponents,
                        }}
                      />
                    </ReferenceTablePopover>
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          }}
        </For>
      </Table.Body>
    </Table.Root>
  );
}
