/**
 * Build a single address string from parts (for Mapbox geocoding and storage).
 * Format: "Street, PostalCode City, Country"
 */
export function buildAddress(
  street: string,
  city: string,
  postalCode: string,
  country: string
): string {
  const parts = [
    (street || '').trim(),
    [postalCode, city].filter(Boolean).join(' ').trim(),
    (country || '').trim()
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Parse a stored address string into parts for form editing.
 * Expects format: "Street, PostalCode City, Country" (comma-separated, 3 segments).
 */
export function parseAddress(address: string): {
  street: string;
  city: string;
  postalCode: string;
  country: string;
} {
  if (!address?.trim()) {
    return { street: '', city: '', postalCode: '', country: '' };
  }
  const segments = address.split(',').map((s) => s.trim()).filter(Boolean);
  if (segments.length >= 3) {
    const street = segments[0];
    const country = segments[segments.length - 1];
    const middle = segments.slice(1, -1).join(', ');
    const middleParts = middle.split(/\s+/);
    const postalCode = middleParts.length > 0 && /^\d+/.test(middleParts[0]) ? middleParts[0] : '';
    const city = middleParts.length > 1 ? middleParts.slice(1).join(' ') : middle;
    return { street, city, postalCode, country };
  }
  if (segments.length === 2) {
    return { street: segments[0], city: segments[1], postalCode: '', country: '' };
  }
  if (segments.length === 1) {
    return { street: segments[0], city: '', postalCode: '', country: '' };
  }
  return { street: '', city: '', postalCode: '', country: '' };
}
