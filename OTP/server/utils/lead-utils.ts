/**
 * Utility functions for lead management
 */

/**
 * Generates a unique lead ID in the format LD-YYYY-XXXX
 * LD: Lead prefix
 * YYYY: Current year
 * XXXX: Sequential number padded to 4 digits
 * 
 * @param lastLeadNumber The last lead number used (to be incremented)
 * @returns A formatted lead ID string
 */
export function generateLeadId(lastLeadNumber: number = 0): string {
  const currentYear = new Date().getFullYear();
  const leadNumber = lastLeadNumber + 1;
  const paddedNumber = leadNumber.toString().padStart(4, '0');
  return `LD-${currentYear}-${paddedNumber}`;
}

/**
 * Extracts the lead number from a lead ID
 * 
 * @param leadId The lead ID string (e.g., LD-2025-0001)
 * @returns The numeric part as a number or 0 if invalid format
 */
export function extractLeadNumber(leadId: string): number {
  const match = leadId.match(/LD-\d{4}-(\d{4})/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 0;
}

/**
 * Gets the current year prefix for lead IDs
 * 
 * @returns The current year prefix (e.g., LD-2025-)
 */
export function getCurrentYearPrefix(): string {
  const currentYear = new Date().getFullYear();
  return `LD-${currentYear}-`;
}