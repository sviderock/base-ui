import { createRenderer, describeConformance } from '#test-utils';
import { Select } from '@base-ui-components/solid/select';
import { Dynamic } from 'solid-js/web';

describe('<Select.ScrollUpArrow />', () => {
  const { render } = createRenderer();

  describeConformance(
    (props: any) => <Select.ScrollUpArrow {...props} ref={props.ref} keepMounted />,
    () => ({
      refInstanceof: window.HTMLDivElement,
      render(node, elementProps = {}) {
        return render(
          () => (
            <Select.Root open>
              <Select.Positioner>
                <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
              </Select.Positioner>
            </Select.Root>
          ),
          elementProps,
        );
      },
    }),
  );
});
