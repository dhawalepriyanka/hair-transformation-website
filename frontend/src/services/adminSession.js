import { useSyncExternalStore } from 'react';

// Remove tokens created by older builds, where admin access survived browser restarts.
try { localStorage.removeItem('adminToken'); } catch { /* Storage may be unavailable. */ }

export const hasAdminSession = () => {
  try { return !!sessionStorage.getItem('adminToken'); } catch { return false; }
};

export function setAdminSession(token) {
  if (token) sessionStorage.setItem('adminToken', token);
  else sessionStorage.removeItem('adminToken');
  try { localStorage.removeItem('adminToken'); } catch { /* Clear legacy storage when possible. */ }
  window.dispatchEvent(new Event('admin-session-change'));
}

function subscribe(callback) {
  window.addEventListener('storage', callback);
  window.addEventListener('admin-session-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('admin-session-change', callback);
  };
}

export const useAdminSession = () => useSyncExternalStore(subscribe, hasAdminSession, () => false);
