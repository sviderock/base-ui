import { createRenderer, describeConformance } from '#test-utils';
import { Select } from '@base-ui-components/solid/select';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';
import { Dynamic } from 'solid-js/web';

describe('<Select.Group />', () => {
  const { render } = createRenderer();

  describeConformance(Select.Group, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node, elementProps = {}) {
      return render(
        () => (
          <Select.Root open>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Select.Root>
        ),
        elementProps,
      );
    },
  }));

  it('should render group with label', async () => {
    render(() => (
      <Select.Root open>
        <Select.Positioner>
          <Select.Group>
            <Select.GroupLabel>Fruits</Select.GroupLabel>
            <Select.Item value="apple">Apple</Select.Item>
            <Select.Item value="banana">Banana</Select.Item>
          </Select.Group>
        </Select.Positioner>
      </Select.Root>
    ));

    expect(screen.getByRole('group')).to.have.attribute('aria-labelledby');
    expect(screen.getByText('Fruits')).toBeVisible();
  });

  it('should associate label with group', async () => {
    render(() => (
      <Select.Root open>
        <Select.Positioner>
          <Select.Group>
            <Select.GroupLabel>Vegetables</Select.GroupLabel>
            <Select.Item value="carrot">Carrot</Select.Item>
            <Select.Item value="lettuce">Lettuce</Select.Item>
          </Select.Group>
        </Select.Positioner>
      </Select.Root>
    ));

    const Group = screen.getByRole('group');
    const label = screen.getByText('Vegetables');
    expect(Group).to.have.attribute('aria-labelledby', label.id);
  });
});
