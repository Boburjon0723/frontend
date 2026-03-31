/**
 * Auth storage: token, refreshToken, user.
 * - "Eslab qolaylik" (remember me) = true: saqlash localStorage da (brauzer yopilsa ham qoladi).
 * - "Eslab qolaylik" = false: saqlash sessionStorage da (faqat shu oyna/yotiq; brauzer yopilganda o'chadi).
 */
const REMEMBER_ME_KEY = 'remember_me';

function getStorage(): Storage {
  if (typeof window === 'undefined') return localStorage;
  return localStorage.getItem(REMEMBER_ME_KEY) === 'false' ? sessionStorage : localStorage;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
}

export function getUser(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * @param remember - true = localStorage (eslab qolish), false = sessionStorage (faqat shu sessiya).
 */
export function setAuth(
  token: string,
  refreshToken: string,
  user: Record<string, unknown>,
  remember: boolean
): void {
  if (typeof window === 'undefined') return;
  const storage = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  storage.setItem('token', token);
  storage.setItem('refreshToken', refreshToken);
  storage.setItem('user', JSON.stringify(user));
  localStorage.setItem(REMEMBER_ME_KEY, String(remember));
  other.removeItem('token');
  other.removeItem('refreshToken');
  other.removeItem('user');
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
}

/** Token/user o‘qishda qaysi storage dan o‘qilishini bilish uchun (masalan refresh keyingi yozishda). */
export function getStorageForAuth(): Storage {
  return getStorage();
}

/** Faqat user ni yangilash (profil o‘zgarishi va h.k.). */
export function setUser(user: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  getStorage().setItem('user', JSON.stringify(user));
}
