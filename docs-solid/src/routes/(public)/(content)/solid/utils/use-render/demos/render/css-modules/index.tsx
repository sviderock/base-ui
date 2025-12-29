'use client';
import { mergeProps } from '@base-ui-components/solid/merge-props';
import { useRender } from '@base-ui-components/solid/use-render';
import { splitProps } from 'solid-js';
import styles from './index.module.css';

interface TextProps extends useRender.ComponentProps<'p'> {}

function Text(props: TextProps) {
  const [local, otherProps] = splitProps(props, ['render']);
  const render = () => local.render ?? 'p';

  const element = useRender({
    get render() {
      return render();
    },
    props: mergeProps<'p'>({ class: styles.Text }, otherProps),
  });

  return <>{element()}</>;
}

export default function ExampleText() {
  return (
    <div>
      <Text>Text component rendered as a paragraph tag</Text>
      <Text render="strong">Text component rendered as a strong tag</Text>
    </div>
  );
}
