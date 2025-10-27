import { splitProps, type Component, type ComponentProps } from 'solid-js';
import { Code } from './components/Code';
import * as CodeBlock from './components/CodeBlock';
import { DemoLoader } from './components/Demo/DemoLoader';
import { HeadingLink } from './components/HeadingLink';
import { Kbd } from './components/Kbd/Kbd';
import { Link } from './components/Link';
import QuickNav from './components/QuickNav';
import { AttributesReferenceTable } from './components/ReferenceTable/AttributesReferenceTable';
import { CssVariablesReferenceTable } from './components/ReferenceTable/CssVariablesReferenceTable';
import { PropsReferenceTable } from './components/ReferenceTable/PropsReferenceTable';
import { Subtitle } from './components/Subtitle/Subtitle';
import Table from './components/Table';
import { getChildrenText } from './utils/getChildrenText';

interface MDXComponents {
  [key: string]: Component<any> | MDXComponents;
}

// Maintain spacing between MDX components here
export const mdxComponents: MDXComponents = {
  a: (props) => <Link {...props} />,
  code: (props) => <Code class="data-[inline]:mx-[0.1em]" {...props} />,
  h1: (props) => (
    // Do not wrap heading tags in divs, that confuses Safari Reader
    <>
      <h1 class="mb-4 text-3xl font-bold text-balance" {...props} />
      <title>{`${getChildrenText(props.children)} · Base UI`}</title>
    </>
  ),
  h2: (props) => {
    const [local, otherProps] = splitProps(props, ['children', 'id']);
    return (
      <h2
        class="mt-10 mb-4 scroll-mt-18 text-xl font-medium text-balance show-side-nav:scroll-mt-6"
        id={local.id}
        {...otherProps}
      >
        <HeadingLink id={local.id}>{local.children}</HeadingLink>
      </h2>
    );
  },
  h3: (props) => {
    const [local, otherProps] = splitProps(props, ['children', 'id']);
    return (
      <h3
        class="mt-8 mb-1.5 scroll-mt-18 text-lg font-medium text-balance show-side-nav:scroll-mt-6"
        id={local.id}
        {...otherProps}
      >
        <HeadingLink id={local.id}>{local.children}</HeadingLink>
      </h3>
    );
  },
  h4: (props) => <h4 class="mt-8 mb-1.5 scroll-mt-6 font-medium text-balance" {...props} />,
  h5: (props) => <h5 class="mt-8 mb-1.5 scroll-mt-6 font-medium text-balance" {...props} />,
  h6: (props) => <h6 class="mt-8 mb-1.5 scroll-mt-6 font-medium text-balance" {...props} />,
  p: (props) => <p class="mb-4" {...props} />,
  li: (props) => <li class="mb-0.5 [&>p]:mb-2" {...props} />,
  ul: (props) => <ul class="mb-4 ml-4.5 list-disc" {...props} />,
  ol: (props) => <ol class="mb-4 ml-7 list-decimal" {...props} />,
  kbd: Kbd,
  strong: (props) => <strong class="font-medium" {...props} />,
  figure: (props) => {
    if ('data-rehype-pretty-code-figure' in props) {
      return <CodeBlock.Root class="mt-5 mb-6" {...props} />;
    }

    return <figure {...props} />;
  },
  figcaption: (props) => {
    if ('data-rehype-pretty-code-title' in props) {
      return <CodeBlock.Panel {...props} />;
    }

    return <figcaption {...props} />;
  },
  // Don't pass the tabindex prop from shiki, most browsers
  // now handle scroll containers focus out of the box
  pre: (props) => {
    const [, otherProps] = splitProps(props, ['tabIndex']);
    return <CodeBlock.Pre {...otherProps} />;
  },
  table: (props) => <Table.Root class="my-5" {...props} />,
  thead: Table.Head,
  tbody: Table.Body,
  tr: Table.Row,
  th: (props: ComponentProps<'th'>) =>
    props.scope === 'row' ? <Table.RowHeader {...props} /> : <Table.ColumnHeader {...props} />,
  td: Table.Cell,

  // Custom components
  // TODO: do we need disable demo ssr in Solid?
  Demo: (props: any) => <DemoLoader class="mt-5 mb-6" {...props} />,
  QuickNav,
  Meta: (props: ComponentProps<'meta'>) => {
    if (props.name === 'description' && String(props.content).length > 170) {
      throw new Error('Meta description shouldn’t be longer than 170 chars');
    }
    return <meta {...props} />;
  },
  Subtitle: (props) => <Subtitle class="-mt-2 mb-5" {...props} />,

  // API reference components
  AttributesReferenceTable: (props) => <AttributesReferenceTable class="mt-5 mb-6" {...props} />,
  CssVariablesReferenceTable: (props) => (
    <CssVariablesReferenceTable class="mt-5 mb-6" {...props} />
  ),
  PropsReferenceTable: (props) => <PropsReferenceTable class="mt-5 mb-6" {...props} />,
};

export const inlineMdxComponents: MDXComponents = {
  ...mdxComponents,
  p: (props) => <p {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return mdxComponents;
}
