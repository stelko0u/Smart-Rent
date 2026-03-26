export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string) {
  return String(value).toLowerCase().trim();
}

export function isValidEmail(value: string) {
  return EMAIL_REGEX.test(normalizeEmail(value));
}
