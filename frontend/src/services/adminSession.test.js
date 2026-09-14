import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getStaffSession, hasAdminSession, setAdminSession } from './adminSession.js';

const memoryStorage = () => {
  const data = new Map();
  return {
    data,
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
};

test('admin controls follow existing login and logout state immediately', () => {
  const data = new Map();
  const storage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
  globalThis.sessionStorage = storage;
  globalThis.localStorage = { removeItem: () => {} };
  globalThis.window = new EventTarget();
  let updates = 0;
  window.addEventListener('admin-session-change', () => updates++);
  assert.equal(hasAdminSession(), false);
  setAdminSession('existing-admin-session');
  assert.equal(hasAdminSession(), true);
  assert.equal(updates, 1);
  setAdminSession(null);
  assert.equal(hasAdminSession(), false);
  assert.equal(updates, 2);
});

test('unavailable browser storage does not grant admin controls', () => {
  globalThis.sessionStorage = { getItem: () => { throw new Error('Storage blocked'); } };
  assert.equal(hasAdminSession(), false);
});

test('expired temporary sessions are rejected locally', () => {
  globalThis.sessionStorage = memoryStorage();
  sessionStorage.setItem('staffSession', JSON.stringify({ token: 'expired', user: { role: 'admin' }, expiresAt: '2020-01-01T00:00:00.000Z' }));
  assert.equal(getStaffSession(), null);
});
