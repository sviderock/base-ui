import { createRenderer, describeConformance } from '#test-utils';
import { Separator } from '@base-ui-components/solid/separator';
import { expect } from 'chai';

describe('<Separator />', () => {
  const { render } = createRenderer();

  describeConformance(Separator, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `separator` role', async () => {
    const { getByRole } = render(() => <Separator />);
    expect(getByRole('separator')).toBeVisible();
  });

  describe('prop: orientation', () => {
    ['horizontal', 'vertical'].forEach((orientation) => {
      it(orientation, async () => {
        const { getByRole } = render(() => (
          <Separator orientation={orientation as Separator.Props['orientation']} />
        ));
        expect(getByRole('separator')).to.have.attribute('aria-orientation', orientation);
      });
    });
  });
});
