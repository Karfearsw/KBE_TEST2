/**
 * Utility functions for formatting and handling contact data
 */

/**
 * Formats a phone number as a clickable tel: link
 * @param phone The phone number to format
 * @returns A formatted tel: URL or null if no phone number
 */
export const formatPhoneLink = (phone: string | null | undefined) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  return `tel:${cleaned}`;
};

/**
 * Formats an email address as a clickable mailto: link
 * @param email The email address to format
 * @returns A formatted mailto: URL or null if no email
 */
export const formatEmailLink = (email: string | null | undefined) => {
  if (!email) return null;
  return `mailto:${email}`;
};

/**
 * Formats an address for Google Maps directions
 * @param address The address to format
 * @returns A Google Maps URL or null if no address
 */
export const formatAddressLink = (address: string | null | undefined) => {
  if (!address) return null;
  const encoded = encodeURIComponent(address);
  return `https://maps.google.com/maps?q=${encoded}`;
};

/**
 * Formats currency values
 * @param value The numeric value to format
 * @returns A formatted currency string or "N/A" if value is null/undefined
 */
export const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formats a date for display
 * @param date The date to format
 * @returns A formatted date string
 */
export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString();
};

/**
 * Formats a source name from kebab-case to Title Case
 * @param source The source name in kebab-case
 * @returns A formatted source name string or "N/A" if source is null/undefined
 */
export const formatSource = (source: string | null | undefined) => {
  if (!source) return "N/A";
  return source
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};