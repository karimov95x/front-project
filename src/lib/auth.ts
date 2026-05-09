import type { SessionUser } from "@/types";

export const SESSION_COOKIE = "medexchange_session";
const SESSION_STORAGE_KEY = "medexchange_user";
const SESSION_EVENT = "medexchange-session-change";

function notifySessionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
}

function persistSessionUser(user: SessionUser, notify: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 12}; samesite=lax`;

  if (notify) {
    notifySessionChanged();
  }
}

function resetSessionUser(notify: boolean): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }

  if (notify) {
    notifySessionChanged();
  }
}

export function getFallbackSessionUser(): SessionUser | null {
  return null;
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function saveSessionUser(user: SessionUser): void {
  persistSessionUser(user, true);
}

export function hydrateSessionUser(user: SessionUser): void {
  persistSessionUser(user, false);
}

export function clearSessionUser(): void {
  resetSessionUser(true);
}

export function clearSessionUserSilently(): void {
  resetSessionUser(false);
}

export function hasSessionCookie(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .some((chunk) => chunk.startsWith(`${SESSION_COOKIE}=`));
}

export function sessionEventName(): string {
  return SESSION_EVENT;
}
