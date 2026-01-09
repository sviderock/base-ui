import { Tooltip } from '@msviderok/base-ui-solid/tooltip';
import { PackageManagerSnippetProvider } from 'docs-solid/src/blocks/PackageManagerSnippet/PackageManagerSnippetProvider';
import { DemoVariantSelectorProvider } from 'docs-solid/src/components/Demo/DemoVariantSelectorProvider';
import type { ParentProps } from 'solid-js';

export function DocsProviders(props: ParentProps) {
  return (
    <Tooltip.Provider delay={350}>
      <DemoVariantSelectorProvider defaultVariant="css-modules" defaultLanguage="ts">
        <PackageManagerSnippetProvider defaultValue="npm">
          {props.children}
        </PackageManagerSnippetProvider>
      </DemoVariantSelectorProvider>
    </Tooltip.Provider>
  );
}
