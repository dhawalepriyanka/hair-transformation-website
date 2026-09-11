import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrollToPageTop } from './navigation.js';

test('page navigation resets the browser to the upper-left corner', () => {
  let options;
  globalThis.window = { scrollTo: value => { options = value; } };
  scrollToPageTop();
  assert.deepEqual(options, { top: 0, left: 0, behavior: 'auto' });
});
