// /lib/auth.ts
const ACCESS_TOKEN_KEY = "accessToken";

/** Salva o token no client (menos seguro que httpOnly) */
export function setAuthToken(token: string) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {}
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {}
}
