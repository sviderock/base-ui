import { createRenderer, describeConformance } from '#test-utils';
import { Separator } from '@base-ui-components/solid/separator';
import { screen } from '@solidjs/testing-library';
import { expect } from 'chai';

describe('<Separator />', () => {
  const { render } = createRenderer();

  describeConformance(Separator, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `separator` role', async () => {
    render(() => <Separator />);
    expect(screen.getByRole('separator')).toBeVisible();
  });

  describe('prop: orientation', () => {
    ['horizontal', 'vertical'].forEach((orientation) => {
      it(orientation, async () => {
        render(() => <Separator orientation={orientation as Separator.Props['orientation']} />);
        expect(screen.getByRole('separator')).to.have.attribute('aria-orientation', orientation);
      });
    });
  });
});
