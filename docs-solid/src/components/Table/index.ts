import { clientOnly } from '@solidjs/start';

export default {
  Root: clientOnly(async () => ({ default: (await import('./Table')).Root })),
  Head: clientOnly(async () => ({ default: (await import('./Table')).Head })),
  Body: clientOnly(async () => ({ default: (await import('./Table')).Body })),
  Row: clientOnly(async () => ({ default: (await import('./Table')).Row })),
  ColumnHeader: clientOnly(async () => ({ default: (await import('./Table')).ColumnHeader })),
  RowHeader: clientOnly(async () => ({ default: (await import('./Table')).RowHeader })),
  Cell: clientOnly(async () => ({ default: (await import('./Table')).Cell })),
};
