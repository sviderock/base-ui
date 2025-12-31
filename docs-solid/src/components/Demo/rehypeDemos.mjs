import camelCase from 'lodash/camelCase.js';
import upperFirst from 'lodash/upperFirst.js';
import { dirname, join } from 'path';
import { visit } from 'unist-util-visit';
import { loadDemo } from './loadDemo';

/**
 * Enhances `<Demo>` components in MDX:
 * - Converts `path` prop value into an absolute pathname
 * - Adds `scope` prop based on the `path` value
 * - Adds corresponding import statements for the live demo components
 *
 * Example input:
 * ```
 * <Demo path="./foo/bar" />
 * ```
 *
 * Corresponding output:
 * ```
 * import * as FooBar from './foo/bar';
 * <Demo path="/absolute/path/to/foo/bar" scope={FooBar} />
 * ```
 */
export function rehypeDemos() {
  return async (tree, file) => {
    const paths = [];

    visit(tree, (node) => {
      if (node.name === 'Demo' && node.attributes) {
        const path = node.attributes.find(({ name }) => name === 'path');

        if (!path?.value) {
          return;
        }

        const importName = upperFirst(camelCase(path.value));
        const fullPath = join(dirname(file.path), path.value);
        paths.push({ value: path.value, fullPath, importName, node });

        // Add `scope` prop
        node.attributes.push({
          type: 'mdxJsxAttribute',
          name: 'scope',
          value: {
            type: 'mdxJsxAttributeValueExpression',
            value: importName,
            data: {
              estree: {
                type: 'Program',
                body: [
                  {
                    type: 'ExpressionStatement',
                    expression: {
                      type: 'Identifier',
                      name: importName,
                    },
                  },
                ],
                sourceType: 'module',
                comments: [],
              },
            },
          },
        });
      }
    });

    // For each path we saw, insert import statements at the start of the file
    for (const { value, fullPath, importName, node } of paths) {
      const metadata = await loadDemo(fullPath);

      node.attributes.push({
        type: 'mdxJsxAttribute',
        name: 'metadata',
        value: JSON.stringify(metadata),
      });

      tree.children.unshift({
        type: 'mdxjsEsm',
        value: `import * as ${importName} from '${value}';`,
        data: {
          estree: {
            type: 'Program',
            body: [
              {
                type: 'ImportDeclaration',
                specifiers: [
                  {
                    type: 'ImportNamespaceSpecifier',
                    local: {
                      type: 'Identifier',
                      name: importName,
                    },
                  },
                ],
                source: {
                  type: 'Literal',
                  value: `${value}`,
                  raw: `'${value}'`,
                },
              },
            ],
            sourceType: 'module',
            comments: [],
          },
        },
      });
    }
  };
}
