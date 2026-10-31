export const SESSION_EXPIRED_EVENT = "lighthouse:session-expired";
const tokenKey = "lighthouse-token";

export function sessionToken() {
  try {
    return sessionStorage.getItem(tokenKey);
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(tokenKey);
  } catch {
    /* Storage may be disabled. */
  }
}

export function storeSession(token: string) {
  try {
    sessionStorage.setItem(tokenKey, token);
  } catch {
    throw new Error("Allow site storage in your browser to stay signed in.");
  }
}
