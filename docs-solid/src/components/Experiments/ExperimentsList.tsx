import { A } from '@solidjs/router';
import clsx from 'clsx';
import { camelToSentenceCase } from 'docs-solid/src/utils/camelToSentenceCase';
import glob from 'fast-glob';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMemo, For, Show, type JSX } from 'solid-js';
import classes from './ExperimentsList.module.css';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const experimentsRootDirectory = resolve(currentDirectory, '../../routes/(private)/experiments');

const allExperimentFiles = glob.globSync(
  ['**/*.tsx', '!infra/**/*', '!**/page.tsx', '!**/layout.tsx'],
  { cwd: experimentsRootDirectory },
);

const groups: Record<string, { name: string; path: string }[]> = {};

for (const key of allExperimentFiles) {
  const segments = key.split('/');
  let group: string;
  let name: string;

  if (segments.length === 1) {
    group = '*';
    name = segments[0];
  } else {
    group = camelToSentenceCase(segments[0]);
    name =
      segments[1].toLowerCase().startsWith(`${group.toLowerCase()}-`) &&
      segments[1].length > group.length
        ? segments[1].slice(group.length + 1).trim()
        : segments[1].trim();
  }

  if (!groups[group]) {
    groups[group] = [];
  }

  if (!name.startsWith('_')) {
    groups[group].push({
      name: camelToSentenceCase(name.replace('.tsx', '').replace(/-/g, ' ')),
      path: key.replace('.tsx', ''),
    });
  }
}

export function ExperimentsList(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const filteredGroups = createMemo(() =>
    Object.keys(groups)
      .sort()
      .filter((key) => key !== '*')
      .map((group) => {
        return {
          name: group,
          experiments: groups[group].sort((a, b) => a.name.localeCompare(b.name)),
        };
      }),
  );

  const otherExperiments = createMemo(() => {
    return groups['*']?.sort((a, b) => a.name.localeCompare(b.name)) ?? [];
  });

  return (
    <div {...props} class={clsx(classes.list, props.class)}>
      <h2>All experiments</h2>
      <For each={filteredGroups()}>
        {(group) => (
          <div>
            <h3>{group.name}</h3>
            <ul class={classes.groupItems}>
              <For each={group.experiments}>
                {(experiment) => (
                  <li>
                    <A href={`/experiments/${experiment.path}`}>{experiment.name}</A>
                  </li>
                )}
              </For>
            </ul>
          </div>
        )}
      </For>

      <Show when={groups['*']}>
        <div>
          <h3>Other</h3>
          <ul class={classes.groupItems}>
            <For each={otherExperiments()}>
              {(experiment) => (
                <li>
                  <A href={`/experiments/${experiment.path}`}>{experiment.name}</A>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </div>
  );
}
