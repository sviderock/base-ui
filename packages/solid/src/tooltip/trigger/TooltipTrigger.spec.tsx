import { Tooltip } from '@base-ui-components/solid/tooltip';

// `props: any` will error
<Tooltip.Trigger render={{ component: 'button', type: 'button' }} />;
<Tooltip.Trigger render="input" />;
