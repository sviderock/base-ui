import { expectType } from '#test-utils';
import type { Accessor, Component } from 'solid-js';
import { useRenderElement } from './useRenderElement';

const element1 = useRenderElement('div', {}, {});

expectType<Accessor<Component<Record<string, unknown>>>, typeof element1>(element1);

const element2 = useRenderElement(
  'div',
  {},
  {
    enabled: true,
  },
);

expectType<Accessor<Component<Record<string, unknown>>>, typeof element2>(element2);

const element3 = useRenderElement(
  'div',
  {},
  {
    enabled: false,
  },
);

expectType<Accessor<null>, typeof element3>(element3);

const element4 = useRenderElement(
  'div',
  {},
  {
    enabled: Math.random() > 0.5,
  },
);

expectType<Accessor<Component<Record<string, unknown>> | null>, typeof element4>(element4);
