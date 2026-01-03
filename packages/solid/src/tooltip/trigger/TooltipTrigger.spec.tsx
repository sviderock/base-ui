import { Tooltip } from '@msviderok/base-ui-solid/tooltip';

// `props: any` will error
<Tooltip.Trigger render={{ component: 'button', type: 'button' }} />;
<Tooltip.Trigger render="input" />;
