/**
 * Get next invoice number for a user
 * This would typically be implemented with a database counter or sequence
 */
import { prisma } from '@iworked/db';

/**
 * Generate invoice number in format: INV-YYYY-NNNN
 * Where YYYY is the current year and NNNN is a zero-padded sequential number
 */
export function generateInvoiceNumber(
  year: number,
  sequenceNumber: number,
): string {
  const paddedNumber = sequenceNumber.toString().padStart(4, '0');
  return `INV-${year}-${paddedNumber}`;
}

/**
 * Parse invoice number to extract year and sequence
 */
export function parseInvoiceNumber(invoiceNumber: string): {
  year: number;
  sequence: number;
} | null {
  const match = invoiceNumber.match(/^INV-(\d{4})-(\d{4})$/);
  if (!match) return null;

  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  };
}

export async function getNextInvoiceNumber(userId: string): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Find the highest sequence number for the current year for this user
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      userId,
      invoiceNumber: {
        startsWith: `INV-${currentYear}-`,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  });

  let nextSequence = 1;
  if (lastInvoice?.invoiceNumber) {
    const parsed = parseInvoiceNumber(lastInvoice.invoiceNumber);
    if (parsed && parsed.year === currentYear) {
      nextSequence = parsed.sequence + 1;
    }
  }

  return generateInvoiceNumber(currentYear, nextSequence);
}

/**
 * Validate invoice number format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  return /^INV-\d{4}-\d{4}$/.test(invoiceNumber);
}
