import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasAdminSession, setAdminSession } from './adminSession.js';

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
