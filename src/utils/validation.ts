export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isNotEmpty(value: string): boolean {
  return value != null && value.trim().length > 0;
}

export function isValidLength(
  value: string,
  min: number,
  max?: number
): boolean {
  const length = value.trim().length;
  if (length < min) return false;
  if (max !== undefined && length > max) return false;
  return true;
}

export function sanitizeString(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}

export function isValidText(value: string): boolean {
  // Allow letters, numbers, spaces, and common punctuation
  const textRegex = /^[a-zA-Z0-9\s.,!?;:()\-\u00C0-\u017F]+$/;
  return textRegex.test(value);
}
