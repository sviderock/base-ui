import { expectType } from '#test-utils';
import type { Component } from 'solid-js';
import type { HTMLProps } from '../utils/types';
import { useRenderElement } from './useRenderElement';

const element1 = useRenderElement('div', {}, {});

expectType<Component<HTMLProps>, typeof element1>(element1);

const element2 = useRenderElement(
  'div',
  {},
  {
    enabled: true,
  },
);

expectType<Component<HTMLProps>, typeof element2>(element2);

const element3 = useRenderElement(
  'div',
  {},
  {
    enabled: false,
  },
);

expectType<Component<HTMLProps>, typeof element3>(element3);

const element4 = useRenderElement(
  'div',
  {},
  {
    enabled: Math.random() > 0.5,
  },
);

expectType<Component<HTMLProps>, typeof element4>(element4);
