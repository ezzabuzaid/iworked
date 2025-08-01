import type {
  Client,
  Invoice,
  InvoiceLine,
  Project,
  TimeEntry,
} from '@iworked/db';

import { calculateDurationHours, roundToTwoDecimals } from './calculations.ts';

/**
 * Convert array of objects to CSV format
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
): string {
  if (data.length === 0) {
    return headers.map((h) => h.label).join(',') + '\n';
  }

  // Create header row
  const headerRow = headers.map((h) => h.label).join(',');

  // Create data rows
  const dataRows = data.map((item) =>
    headers
      .map((header) => {
        const value = item[header.key];
        // Escape commas and quotes in CSV
        if (
          typeof value === 'string' &&
          (value.includes(',') || value.includes('"'))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      })
      .join(','),
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Export time entries to CSV
 */
export function exportTimeEntriesToCSV(
  timeEntries: (TimeEntry & {
    project: Project & {
      client: Client | null;
    };
  })[],
): string {
  const headers = [
    { key: 'startedAt' as const, label: 'Start Date/Time' },
    { key: 'endedAt' as const, label: 'End Date/Time' },
    { key: 'duration' as const, label: 'Duration (Hours)' },
    { key: 'clientName' as const, label: 'Client' },
    { key: 'projectName' as const, label: 'Project' },
    { key: 'hourlyRate' as const, label: 'Hourly Rate' },
    { key: 'amount' as const, label: 'Amount' },
    { key: 'note' as const, label: 'Note' },
    { key: 'isLocked' as const, label: 'Locked' },
  ];

  const csvData = timeEntries.map((entry) => {
    const duration = calculateDurationHours(entry.startedAt, entry.endedAt);
    const hourlyRate = entry.project.hourlyRate
      ? parseFloat(entry.project.hourlyRate.toString())
      : 0;
    const amount = duration * hourlyRate;

    return {
      startedAt: entry.startedAt.toISOString(),
      endedAt: entry.endedAt.toISOString(),
      duration: roundToTwoDecimals(duration),
      clientName: entry.project.client?.name || 'No Client',
      projectName: entry.project.name,
      hourlyRate: roundToTwoDecimals(hourlyRate),
      amount: roundToTwoDecimals(amount),
      note: entry.note || '',
      isLocked: entry.isLocked ? 'Yes' : 'No',
    };
  });

  return arrayToCSV(csvData, headers);
}

/**
 * Export invoices to CSV
 */
export function exportInvoicesToCSV(
  invoices: (Invoice & {
    client: Client;
    invoiceLines: (InvoiceLine & { project: Project })[];
  })[],
): string {
  const headers = [
    { key: 'invoiceNumber' as const, label: 'Invoice Number' },
    { key: 'clientName' as const, label: 'Client' },
    { key: 'status' as const, label: 'Status' },
    { key: 'dateFrom' as const, label: 'Period From' },
    { key: 'dateTo' as const, label: 'Period To' },
    { key: 'totalAmount' as const, label: 'Total Amount' },
    { key: 'sentAt' as const, label: 'Sent Date' },
    { key: 'paidAt' as const, label: 'Paid Date' },
    { key: 'paidAmount' as const, label: 'Paid Amount' },
    { key: 'createdAt' as const, label: 'Created Date' },
  ];

  const csvData = invoices.map((invoice) => {
    const totalAmount = invoice.invoiceLines.reduce(
      (sum, line) => sum + parseFloat(line.amount.toString()),
      0,
    );

    return {
      invoiceNumber: invoice.invoiceNumber || invoice.id.substring(0, 8), // Use invoiceNumber field, fallback to ID
      clientName: invoice.client.name,
      status: invoice.status,
      dateFrom: invoice.dateFrom.toISOString().split('T')[0],
      dateTo: invoice.dateTo.toISOString().split('T')[0],
      totalAmount: roundToTwoDecimals(totalAmount),
      sentAt: invoice.sentAt?.toISOString().split('T')[0] || '',
      paidAt: invoice.paidAt?.toISOString().split('T')[0] || '',
      paidAmount: invoice.paidAmount
        ? roundToTwoDecimals(parseFloat(invoice.paidAmount.toString()))
        : '',
      createdAt: invoice.createdAt.toISOString().split('T')[0],
    };
  });

  return arrayToCSV(csvData, headers);
}

/**
 * Export summary report to CSV
 */
export function exportSummaryReportToCSV(
  summaryData: Array<{
    id: string;
    name: string;
    type: 'client' | 'project';
    clientName?: string;
    totalHours: number;
    totalAmount: number;
    hourlyRate?: number;
  }>,
  dateRange: { startDate: string; endDate: string },
): string {
  const headers = [
    { key: 'type' as const, label: 'Type' },
    { key: 'name' as const, label: 'Name' },
    { key: 'clientName' as const, label: 'Client' },
    { key: 'totalHours' as const, label: 'Total Hours' },
    { key: 'hourlyRate' as const, label: 'Hourly Rate' },
    { key: 'totalAmount' as const, label: 'Total Amount' },
  ];

  const csvData = summaryData.map((item) => ({
    type: item.type === 'client' ? 'Client' : 'Project',
    name: item.name,
    clientName: item.clientName || '',
    totalHours: item.totalHours,
    hourlyRate: item.hourlyRate || '',
    totalAmount: item.totalAmount,
  }));

  // Add header with date range
  const dateRangeHeader = `Summary Report - ${dateRange.startDate} to ${dateRange.endDate}\n\n`;

  return dateRangeHeader + arrayToCSV(csvData, headers);
}

/**
 * Set CSV response headers
 */
export function getCSVHeaders(filename: string): Record<string, string> {
  return {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-cache',
  };
}
