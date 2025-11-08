/**
 * Utility functions for generating and formatting Lead IDs
 */

/**
 * Formats a numeric ID into a FlipStackk lead ID format
 * @param id The numeric lead ID
 * @param createdAt The date the lead was created (used for the year portion)
 * @returns A formatted lead ID string (e.g., LD-2025-0001)
 */
export function formatLeadId(id: number, createdAt: string | Date): string {
  const year = new Date(createdAt).getFullYear();
  const paddedId = id.toString().padStart(4, '0');
  return `LD-${year}-${paddedId}`;
}

/**
 * Extracts the numeric ID from a formatted lead ID
 * @param formattedId The formatted lead ID (e.g., LD-2025-0001)
 * @returns The numeric part as a number or null if invalid format
 */
export function extractNumericId(formattedId: string): number | null {
  // Pattern: LD-YYYY-XXXX
  const match = formattedId.match(/LD-\d{4}-(\d{4})/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}