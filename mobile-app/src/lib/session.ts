export type AppRole = "admin" | "rider";

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: AppRole;
  city: string;
  platform: string;
};

const TOKEN_KEY = "rideguard-rider-token";
const USER_KEY = "rideguard-rider-user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
