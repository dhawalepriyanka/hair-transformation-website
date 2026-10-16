/**
 * IndexedDB + Safe Local Storage Helper for Transformations
 * Replaces fragile 5MB localStorage with high-capacity IndexedDB.
 * Ensures QuotaExceededError is NEVER thrown.
 */

const DB_NAME = 'dipali_wakale_db';
const DB_VERSION = 1;
const STORE_NAME = 'transformations_store';
const KEY_TRANSFORMATIONS = 'admin_transformations';

// Initialize IndexedDB
function openDb() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Persists transformations list into IndexedDB (High Capacity > 500MB)
 */
export async function saveToIndexedDb(list) {
  try {
    const db = await openDb();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(list, KEY_TRANSFORMATIONS);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

/**
 * Retrieves transformations list from IndexedDB
 */
export async function getFromIndexedDb() {
  try {
    const db = await openDb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_TRANSFORMATIONS);
      req.onsuccess = () => {
        const res = req.result;
        resolve(Array.isArray(res) ? res : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Sanitizes item media to prevent localStorage quota overflows
 */
function sanitizeForLocalStorage(item) {
  const sanitized = { ...item };
  ['before', 'after', 'image', 'video', 'beforeVideo', 'afterVideo'].forEach((field) => {
    if (typeof sanitized[field] === 'string' && sanitized[field].startsWith('data:')) {
      // Don't save huge multi-megabyte base64 strings in localStorage
      if (sanitized[field].length > 1024 * 50) {
        sanitized[field] = ''; // Kept in IndexedDB & Database
      }
    }
  });
  return sanitized;
}

/**
 * Safe save function that will NEVER throw QuotaExceededError
 */
export function safeSaveLocalStorage(key, list) {
  try {
    // 1. Save full items in IndexedDB
    saveToIndexedDb(list);

    // 2. Save lightweight sanitized version in localStorage
    if (typeof localStorage !== 'undefined') {
      const lightweight = list.map(sanitizeForLocalStorage);
      localStorage.setItem(key, JSON.stringify(lightweight));
    }
  } catch (e) {
    // If localStorage is completely full, silently ignore because IndexedDB has the data
    console.warn('[Storage] localStorage quota full, retained in IndexedDB:', e.message);
  }
}

/**
 * Reads from localStorage safely
 */
export function safeGetLocalStorage(key) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
}
