import { expectType } from '#test-utils';
import type { JSX } from 'solid-js';
import { RenderElement } from './useRenderElement';

const element1 = <RenderElement element="div" componentProps={{}} params={{}} ref={null} />;

expectType<JSX.Element, typeof element1>(element1);

const element2 = (
  <RenderElement element="div" componentProps={{}} params={{ enabled: () => true }} ref={null} />
);

expectType<JSX.Element, typeof element2>(element2);

const element3 = (
  <RenderElement element="div" componentProps={{}} params={{ enabled: () => false }} ref={null} />
);

expectType<JSX.Element, typeof element3>(element3);

const element4 = (
  <RenderElement
    element="div"
    componentProps={{}}
    params={{ enabled: () => Math.random() > 0.5 }}
    ref={null}
  />
);

expectType<JSX.Element, typeof element4>(element4);
