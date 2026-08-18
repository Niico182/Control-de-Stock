const ARG_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function formatArgDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function parseArgDate(value: string): Date | null {
  const match = value.trim().match(ARG_DATE_PATTERN);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatArgDate(date: Date | string) {
  const value = typeof date === "string" ? parseArgDate(date) ?? new Date(date) : date;

  if (Number.isNaN(value.getTime())) {
    return "—";
  }

  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();

  return `${day}/${month}/${year}`;
}

export function isValidArgDate(value: string) {
  return parseArgDate(value) !== null;
}

export function argDateToIso(value: string) {
  const date = parseArgDate(value);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isoDateToArg(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
