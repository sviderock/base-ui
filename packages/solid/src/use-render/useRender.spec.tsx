import { expectType } from '#test-utils';
import type { JSX } from 'solid-js';
import type { HTMLProps } from '../utils/types';
import { useRender } from './useRender';

const element1 = useRender({
  render: () => <div>Test</div>,
});

expectType<(props?: HTMLProps) => JSX.Element, typeof element1>(element1);

const element2 = useRender({
  render: () => <div>Test</div>,
  enabled: true,
});

expectType<(props?: HTMLProps) => JSX.Element, typeof element2>(element2);

const element3 = useRender({
  render: () => <div>Test</div>,
  enabled: false,
});

expectType<(props?: HTMLProps) => null, typeof element3>(element3);

const element4 = useRender({
  render: () => <div>Test</div>,
  enabled: Math.random() > 0.5,
});

expectType<(props?: HTMLProps) => JSX.Element | null, typeof element4>(element4);
