import { useMemo, useSyncExternalStore } from 'react';

const KEY = 'staffSession';

export const getStaffSession = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch { return null; }
};

export const hasAdminSession = () => getStaffSession()?.user?.role === 'admin';

export function setAdminSession(tokenOrSession, user) {
  if (tokenOrSession) {
    const session = typeof tokenOrSession === 'object' ? tokenOrSession : { token: tokenOrSession, user: user || { role: 'admin' } };
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } else sessionStorage.removeItem(KEY);
  sessionStorage.removeItem('adminToken');
  window.dispatchEvent(new Event('admin-session-change'));
}

function subscribe(callback) {
  window.addEventListener('storage', callback);
  window.addEventListener('admin-session-change', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('admin-session-change', callback); };
}

const getRawSession = () => {
  try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; }
};

export const useStaffSession = () => {
  const raw = useSyncExternalStore(subscribe, getRawSession, () => '');
  return useMemo(() => { try { return JSON.parse(raw) || null; } catch { return null; } }, [raw]);
};
export const useAdminSession = () => useStaffSession()?.user?.role === 'admin';
