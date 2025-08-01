import type { Project, TimeEntry } from '@iworked/db';

/**
 * Calculate duration in hours between two dates
 */
export function calculateDurationHours(startedAt: Date, endedAt: Date): number {
  const durationMs = endedAt.getTime() - startedAt.getTime();
  return durationMs / (1000 * 60 * 60);
}

/**
 * Calculate amount for a time entry
 */
export function calculateTimeEntryAmount(
  startedAt: Date,
  endedAt: Date,
  hourlyRate: number,
): number {
  const hours = calculateDurationHours(startedAt, endedAt);
  return hours * hourlyRate;
}

/**
 * Round to 2 decimal places for financial calculations
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate totals for a set of time entries
 */
export function calculateTimeEntriesTotals(
  timeEntries: (TimeEntry & { project: Project })[],
): {
  totalHours: number;
  totalAmount: number;
} {
  const totals = timeEntries.reduce(
    (acc, entry) => {
      const hours = calculateDurationHours(entry.startedAt, entry.endedAt);
      const hourlyRate = entry.project.hourlyRate
        ? parseFloat(entry.project.hourlyRate.toString())
        : 0;
      const amount = hours * hourlyRate;

      acc.totalHours += hours;
      acc.totalAmount += amount;
      return acc;
    },
    { totalHours: 0, totalAmount: 0 },
  );

  return {
    totalHours: roundToTwoDecimals(totals.totalHours),
    totalAmount: roundToTwoDecimals(totals.totalAmount),
  };
}

/**
 * Group time entries by project and calculate totals
 */
export function groupTimeEntriesByProject(
  timeEntries: (TimeEntry & {
    project: Project & { client?: { id: string; name: string } };
  })[],
): Record<
  string,
  {
    projectId: string;
    projectName: string;
    clientId?: string;
    clientName?: string;
    hourlyRate: number;
    totalHours: number;
    totalAmount: number;
    timeEntryIds: string[];
  }
> {
  return timeEntries.reduce(
    (acc, entry) => {
      const projectId = entry.project.id;
      const hours = calculateDurationHours(entry.startedAt, entry.endedAt);
      const hourlyRate = entry.project.hourlyRate
        ? parseFloat(entry.project.hourlyRate.toString())
        : 0;
      const amount = hours * hourlyRate;

      if (!acc[projectId]) {
        acc[projectId] = {
          projectId,
          projectName: entry.project.name,
          clientId: entry.project.client?.id,
          clientName: entry.project.client?.name,
          hourlyRate,
          totalHours: 0,
          totalAmount: 0,
          timeEntryIds: [],
        };
      }

      acc[projectId].totalHours += hours;
      acc[projectId].totalAmount += amount;
      acc[projectId].timeEntryIds.push(entry.id);

      return acc;
    },
    {} as Record<string, any>,
  );
}

/**
 * Group time entries by client and calculate totals
 */
export function groupTimeEntriesByClient(
  timeEntries: (TimeEntry & {
    project: Project & {
      client: { id: string; name: string };
    };
  })[],
): Record<
  string,
  {
    clientId: string;
    clientName: string;
    totalHours: number;
    totalAmount: number;
    projects: Record<
      string,
      {
        id: string;
        name: string;
        hours: number;
        amount: number;
      }
    >;
  }
> {
  return timeEntries.reduce(
    (acc, entry) => {
      const clientId = entry.project.client.id;
      const clientName = entry.project.client.name;
      const projectId = entry.project.id;
      const projectName = entry.project.name;

      const hours = calculateDurationHours(entry.startedAt, entry.endedAt);
      const hourlyRate = entry.project.hourlyRate
        ? parseFloat(entry.project.hourlyRate.toString())
        : 0;
      const amount = hours * hourlyRate;

      if (!acc[clientId]) {
        acc[clientId] = {
          clientId,
          clientName,
          totalHours: 0,
          totalAmount: 0,
          projects: {},
        };
      }

      acc[clientId].totalHours += hours;
      acc[clientId].totalAmount += amount;

      if (!acc[clientId].projects[projectId]) {
        acc[clientId].projects[projectId] = {
          id: projectId,
          name: projectName,
          hours: 0,
          amount: 0,
        };
      }

      acc[clientId].projects[projectId].hours += hours;
      acc[clientId].projects[projectId].amount += amount;

      return acc;
    },
    {} as Record<string, any>,
  );
}

/**
 * Format hours for display (e.g., "2.5 hours", "1 hour")
 */
export function formatHours(hours: number): string {
  const rounded = roundToTwoDecimals(hours);
  return `${rounded} ${rounded === 1 ? 'hour' : 'hours'}`;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(roundToTwoDecimals(amount));
}

/**
 * Calculate percentage of total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return roundToTwoDecimals((value / total) * 100);
}
