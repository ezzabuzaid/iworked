import { HTTPException } from 'hono/http-exception';

import { prisma } from '@iworked/db';

/**
 * Check for overlapping time entries for a user
 */
export async function checkTimeEntryOverlap(
  userId: string,
  startedAt: Date,
  endedAt: Date,
  excludeEntryId?: string,
): Promise<void> {
  const overlappingEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      id: excludeEntryId ? { not: excludeEntryId } : undefined,
      OR: [
        {
          // New entry starts during existing entry
          startedAt: { lte: startedAt },
          endedAt: { gt: startedAt },
        },
        {
          // New entry ends during existing entry
          startedAt: { lt: endedAt },
          endedAt: { gte: endedAt },
        },
        {
          // New entry completely contains existing entry
          startedAt: { gte: startedAt },
          endedAt: { lte: endedAt },
        },
      ],
    },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  if (overlappingEntries.length > 0) {
    const overlap = overlappingEntries[0];
    throw new HTTPException(400, {
      message: 'Time entry overlaps with existing entry',
      cause: {
        code: 'api/time-entry-overlap',
        detail: `Overlaps with entry for project "${overlap.project.name}" (${overlap.project.client?.name}) from ${overlap.startedAt.toISOString()} to ${overlap.endedAt.toISOString()}`,
        conflictingEntry: {
          id: overlap.id,
          project: overlap.project.name,
          client: overlap.project.client?.name,
          startedAt: overlap.startedAt.toISOString(),
          endedAt: overlap.endedAt.toISOString(),
        },
      },
    });
  }
}

/**
 * Validate time entry duration constraints
 */
export function validateTimeEntryDuration(
  startedAt: Date,
  endedAt: Date,
  maxHours = 24,
): void {
  // Basic validation: end must be after start
  if (endedAt <= startedAt) {
    throw new HTTPException(400, {
      message: 'End time must be after start time',
      cause: {
        code: 'api/invalid-time-range',
        detail: 'endedAt must be greater than startedAt',
      },
    });
  }

  // Duration validation
  const durationHours =
    (endedAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
  if (durationHours > maxHours) {
    throw new HTTPException(400, {
      message: `Time entry duration cannot exceed ${maxHours} hours`,
      cause: {
        code: 'api/duration-too-long',
        detail: `Duration of ${durationHours.toFixed(2)} hours exceeds maximum of ${maxHours} hours`,
      },
    });
  }

  // Minimum duration validation (1 minute)
  if (durationHours < 1 / 60) {
    throw new HTTPException(400, {
      message: 'Time entry must be at least 1 minute long',
      cause: {
        code: 'api/duration-too-short',
        detail: 'Time entries must have a minimum duration of 1 minute',
      },
    });
  }
}

/**
 * Validate business hours (optional feature)
 */
export function validateBusinessHours(
  startedAt: Date,
  endedAt: Date,
  businessHours?: { start: number; end: number }, // Hours in 24h format, e.g., { start: 9, end: 17 }
): void {
  if (!businessHours) return;

  const startHour = startedAt.getHours();
  const endHour = endedAt.getHours();

  if (startHour < businessHours.start || startHour >= businessHours.end) {
    throw new HTTPException(400, {
      message: 'Time entry start time is outside business hours',
      cause: {
        code: 'api/outside-business-hours',
        detail: `Business hours are ${businessHours.start}:00 - ${businessHours.end}:00`,
      },
    });
  }

  if (endHour < businessHours.start || endHour > businessHours.end) {
    throw new HTTPException(400, {
      message: 'Time entry end time is outside business hours',
      cause: {
        code: 'api/outside-business-hours',
        detail: `Business hours are ${businessHours.start}:00 - ${businessHours.end}:00`,
      },
    });
  }
}

/**
 * Check for duplicate client name per user
 */
export async function checkDuplicateClientName(
  userId: string,
  name: string,
  excludeClientId?: string,
): Promise<void> {
  const duplicate = await prisma.client.findFirst({
    where: {
      userId,
      name: {
        equals: name.trim(),
        mode: 'insensitive',
      },
      id: excludeClientId ? { not: excludeClientId } : undefined,
    },
  });
  if (duplicate) {
    throw new HTTPException(400, {
      message: 'Duplicate client name',
      cause: {
        code: 'api/duplicate-client-name',
        detail: `Client name "${name.trim()}" already exists for this user.`,
      },
    });
  }
}

/**
 * Check for duplicate project name per client
 */
export async function checkDuplicateProjectName(
  userId: string,
  clientId: string,
  name: string,
  excludeProjectId?: string,
): Promise<void> {
  const duplicate = await prisma.project.findFirst({
    where: {
      userId,
      clientId,
      name: {
        equals: name.trim(),
        mode: 'insensitive',
      },
      id: excludeProjectId ? { not: excludeProjectId } : undefined,
    },
  });
  if (duplicate) {
    throw new HTTPException(400, {
      message: 'Duplicate project name',
      cause: {
        code: 'api/duplicate-project-name',
        detail: `Project name "${name.trim()}" already exists for this client.`,
      },
    });
  }
}

/**
 * Sanitize input strings
 */
export function sanitizeInput(
  input: string | undefined | null,
): string | undefined {
  if (!input) return undefined;
  return input.trim();
}

/**
 * Validate and sanitize name fields
 */
export function validateName(name: string, fieldName = 'name'): string {
  const sanitized = sanitizeInput(name);
  if (!sanitized || sanitized.length === 0) {
    throw new HTTPException(400, {
      message: `${fieldName} is required`,
      cause: {
        code: 'api/field-required',
        detail: `${fieldName} cannot be empty`,
      },
    });
  }

  if (sanitized.length > 255) {
    throw new HTTPException(400, {
      message: `${fieldName} is too long`,
      cause: {
        code: 'api/field-too-long',
        detail: `${fieldName} cannot exceed 255 characters`,
      },
    });
  }

  return sanitized;
}

/**
 * Check for overlapping time entries for multiple entries in a single query
 * This is optimized for bulk operations to avoid N database queries
 */
export async function checkBulkTimeEntryOverlaps(
  userId: string,
  entries: Array<{
    startedAt: Date;
    endedAt: Date;
    excludeEntryId?: string;
  }>,
): Promise<void> {
  if (entries.length === 0) return;

  // First, check for overlaps within the new entries themselves
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const entry1 = entries[i];
      const entry2 = entries[j];

      // Check if intervals overlap using simple date comparison
      const overlaps =
        entry1.startedAt < entry2.endedAt && entry2.startedAt < entry1.endedAt;

      if (overlaps) {
        throw new HTTPException(400, {
          message: `Time entries ${i + 1} and ${j + 1} overlap with each other`,
          cause: {
            code: 'api/time-entry-overlap',
            detail: `Entry ${i + 1} (${entry1.startedAt.toISOString()} to ${entry1.endedAt.toISOString()}) overlaps with entry ${j + 1} (${entry2.startedAt.toISOString()} to ${entry2.endedAt.toISOString()})`,
            entryIndexes: [i, j],
          },
        });
      }
    }
  }

  // Find the overall time range to query efficiently
  const allStartTimes = entries.map((e) => e.startedAt);
  const allEndTimes = entries.map((e) => e.endedAt);
  const earliestStart = new Date(
    Math.min(...allStartTimes.map((d) => d.getTime())),
  );
  const latestEnd = new Date(Math.max(...allEndTimes.map((d) => d.getTime())));

  // Get all excluded entry IDs
  const excludeIds = entries
    .map((entry) => entry.excludeEntryId)
    .filter(Boolean) as string[];

  // Single query to get all existing entries in the time range
  const existingEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      // Use a more efficient range query
      startedAt: { lt: latestEnd },
      endedAt: { gt: earliestStart },
    },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  // Check each new entry against existing entries
  for (const [index, newEntry] of entries.entries()) {
    for (const existingEntry of existingEntries) {
      // Skip if this is the entry we're excluding
      if (existingEntry.id === newEntry.excludeEntryId) continue;

      // Check if intervals overlap using simple date comparison
      const overlaps =
        newEntry.startedAt < existingEntry.endedAt &&
        existingEntry.startedAt < newEntry.endedAt;

      if (overlaps) {
        throw new HTTPException(400, {
          message: `Time entry ${index + 1} overlaps with existing entry`,
          cause: {
            code: 'api/time-entry-overlap',
            detail: `Entry ${index + 1} (${newEntry.startedAt.toISOString()} to ${newEntry.endedAt.toISOString()}) overlaps with entry for project "${existingEntry.project.name}" (${existingEntry.project.client?.name}) from ${existingEntry.startedAt.toISOString()} to ${existingEntry.endedAt.toISOString()}`,
            conflictingEntry: {
              id: existingEntry.id,
              project: existingEntry.project.name,
              client: existingEntry.project.client?.name,
              startedAt: existingEntry.startedAt.toISOString(),
              endedAt: existingEntry.endedAt.toISOString(),
            },
            entryIndex: index,
          },
        });
      }
    }
  }
}
