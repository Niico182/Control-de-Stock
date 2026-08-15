const REMEMBER_EMAIL_KEY = "control-de-stock-remembered-email";

export function getRememberedEmail() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REMEMBER_EMAIL_KEY);
}

export function saveRememberedEmail(email: string) {
  localStorage.setItem(REMEMBER_EMAIL_KEY, email);
}

export function clearRememberedEmail() {
  localStorage.removeItem(REMEMBER_EMAIL_KEY);
}
