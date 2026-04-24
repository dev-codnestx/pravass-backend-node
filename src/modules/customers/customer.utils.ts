const DD_MM_YYYY_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;

const toDateOrNull = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const text = String(value).trim();
  if (!text) return null;

  const ddMatch = text.match(DD_MM_YYYY_REGEX);
  if (ddMatch) {
    const day = Number(ddMatch[1]);
    const month = Number(ddMatch[2]) - 1;
    const year = Number(ddMatch[3]);
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDateDDMMYYYY = (value: unknown): string => {
  const parsed = toDateOrNull(value);
  if (!parsed) return '';
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = String(parsed.getFullYear());
  return `${day}-${month}-${year}`;
};

export const normalizeBirthdateInput = (value: unknown): string | undefined => {
  const parsed = toDateOrNull(value);
  if (!parsed) return undefined;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateAgeFromBirthdate = (value: unknown): number | undefined => {
  const parsed = toDateOrNull(value);
  if (!parsed) return undefined;

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) age -= 1;
  if (age < 0 || age > 130) return undefined;
  return age;
};

export const normalizeDialCode = (value: unknown): number | undefined => {
  const text = String(value ?? '')
    .replace(/\D/g, '')
    .trim();
  if (!text) return undefined;
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
};

export const formatPhoneWithDialCode = (dialCode?: unknown, phoneNumber?: unknown): string => {
  const phone = String(phoneNumber ?? '')
    .replace(/\D/g, '')
    .trim();
  const dial = normalizeDialCode(dialCode);
  if (!phone) return '';
  if (!dial) return phone;
  return `+${dial} ${phone}`;
};
