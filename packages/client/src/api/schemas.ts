import { KIND } from '../http/index.ts';
import clients from './clients.ts';
import invoices from './invoices.ts';
import projects from './projects.ts';
import reports from './reports.ts';
import timeEntries from './time-entries.ts';

export default {
  ...clients,
  ...projects,
  ...timeEntries,
  ...reports,
  ...invoices,
};
