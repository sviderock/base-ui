import { Tooltip } from '@base-ui-components/solid/tooltip';

// `props: any` will error
<Tooltip.Trigger render={(props) => <button type="button" {...props()} />} />;
<Tooltip.Trigger render={(props) => <input {...props()} />} />;
