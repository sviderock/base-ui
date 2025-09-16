import { createRenderer } from '#test-utils';
import { expect } from 'chai';
import { createSignal, type Accessor, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { useControlled } from './useControlled';

interface TestComponentChildrenArgument {
  value: Accessor<number | string>;
  setValue: (value: number | string) => void;
}

interface TestComponentProps {
  value?: number | string;
  defaultValue?: number | string;
  children: (parames: TestComponentChildrenArgument) => JSX.Element;
}

const TestComponent = (props: TestComponentProps) => {
  const [value, setValue] = useControlled({
    controlled: () => props.value,
    default: () => props.defaultValue,
    name: 'TestComponent',
  });

  return <Dynamic component={props.children} value={value} setValue={setValue} />;
};

describe('useControlled', () => {
  const { render } = createRenderer();

  it('works correctly when is not controlled', () => {
    let valueState!: Accessor<number | string>;
    let setValueState!: TestComponentChildrenArgument['setValue'];

    render(() => (
      <TestComponent defaultValue={1}>
        {({ value, setValue }) => {
          valueState = value;
          setValueState = setValue;
          return null;
        }}
      </TestComponent>
    ));
    expect(valueState()).to.equal(1);

    setValueState(2);

    expect(valueState()).to.equal(2);
  });

  it('works correctly when is controlled', () => {
    let valueState!: Accessor<number | string>;
    render(() => (
      <TestComponent value={1}>
        {({ value }) => {
          valueState = value;
          return null;
        }}
      </TestComponent>
    ));
    expect(valueState()).to.equal(1);
  });

  it('warns when switching from uncontrolled to controlled', () => {
    const [value, setValue] = createSignal<string>();
    expect(() => {
      render(() => <TestComponent value={value()}>{() => null}</TestComponent>);
    }).not.toErrorDev();

    expect(() => {
      setValue('foobar');
    }).toErrorDev(
      'Base UI: A component is changing the uncontrolled value state of TestComponent to be controlled.',
    );
  });

  it('warns when switching from controlled to uncontrolled', () => {
    const [value, setValue] = createSignal<string | undefined>('foobar');

    expect(() => {
      render(() => <TestComponent value={value()}>{() => null}</TestComponent>);
    }).not.toErrorDev();

    expect(() => {
      setValue(undefined);
    }).toErrorDev(
      'Base UI: A component is changing the controlled value state of TestComponent to be uncontrolled.',
    );
  });

  it('warns when changing the defaultValue prop after initial rendering', () => {
    const [defaultValue, setDefaultValue] = createSignal<number>();

    expect(() => {
      render(() => <TestComponent defaultValue={defaultValue()}>{() => null}</TestComponent>);
    }).not.toErrorDev();

    expect(() => {
      setDefaultValue(1);
    }).toErrorDev(
      'Base UI: A component is changing the default value state of an uncontrolled TestComponent after being initialized.',
    );
  });

  it('should not raise a warning if changing the defaultValue when controlled', () => {
    const [defaultValue, setDefaultValue] = createSignal<number>(0);

    expect(() => {
      render(() => (
        <TestComponent value={1} defaultValue={defaultValue()}>
          {() => null}
        </TestComponent>
      ));
    }).not.toErrorDev();

    expect(() => {
      setDefaultValue(1);
    }).not.toErrorDev();
  });

  it('should not raise a warning if setting NaN as the defaultValue when uncontrolled', () => {
    expect(() => {
      render(() => <TestComponent defaultValue={NaN}>{() => null}</TestComponent>);
    }).not.toErrorDev();
  });
});
