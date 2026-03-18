const STORAGE_KEY = 'petpal_user';
const REMEMBER_KEY = 'petpal_remember';

function getRawUserData(): string | null {
  const remember = localStorage.getItem(REMEMBER_KEY) === 'true';
  const storage = remember ? localStorage : sessionStorage;
  return storage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
}

export function getStoredToken(): string | null {
  const raw = getRawUserData();
  if (!raw) return null;
  try {
    return JSON.parse(raw)?.token ?? null;
  } catch {
    return null;
  }
}

export function getStoredUserData(): any | null {
  const raw = getRawUserData();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isUserStored(): boolean {
  return getRawUserData() !== null;
}
