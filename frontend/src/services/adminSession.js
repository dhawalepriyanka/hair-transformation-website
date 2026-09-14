import { useMemo, useSyncExternalStore } from 'react';

const KEY = 'staffSession';

const readSession = storage => {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session?.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) return null;
    return session || null;
  } catch { return null; }
};

export const getStaffSession = () => {
  return readSession(globalThis.sessionStorage);
};

export const hasAdminSession = () => getStaffSession()?.user?.role === 'admin';

export function setAdminSession(tokenOrSession, user) {
  try { sessionStorage.removeItem(KEY); } catch { /* Storage can be blocked. */ }
  try { localStorage.removeItem(KEY); } catch { /* Storage can be blocked. */ }
  try { localStorage.removeItem('rememberedStaffLogin'); } catch { /* Legacy cleanup only. */ }
  if (tokenOrSession) {
    const session = typeof tokenOrSession === 'object' ? tokenOrSession : { token: tokenOrSession, user: user || { role: 'admin' } };
    try { sessionStorage.setItem(KEY, JSON.stringify(session)); } catch { /* Login still fails closed if storage is unavailable. */ }
  }
  try { sessionStorage.removeItem('adminToken'); } catch { /* Legacy cleanup only. */ }
  window.dispatchEvent(new Event('admin-session-change'));
}

function subscribe(callback) {
  window.addEventListener('storage', callback);
  window.addEventListener('admin-session-change', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('admin-session-change', callback); };
}

const getRawSession = () => {
  const session = getStaffSession();
  return session ? JSON.stringify(session) : '';
};

export const useStaffSession = () => {
  const raw = useSyncExternalStore(subscribe, getRawSession, () => '');
  return useMemo(() => { try { return JSON.parse(raw) || null; } catch { return null; } }, [raw]);
};
export const useAdminSession = () => useStaffSession()?.user?.role === 'admin';
