import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { validateMediaFile, validateVideoSource, normalizeTransformation } from './transformationMedia.js';
import { createTransformation, updateTransformation, deleteTransformation, fetchTransformations } from './api.js';

const details = { clientName: 'Client', village: 'Nashik', treatment: 'Styling', rating: 5 };
const video = 'data:video/mp4;base64,AAAA';
let saved;
beforeEach(() => {
  saved = new Map([['admin_transformations', '[]'], ['transformation_video_demo_added_v1', 'true'], ['transformation_video_pair_demo_added_v1', 'true']]);
  globalThis.localStorage = {
    getItem: key => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
  };
});

test('accepts supported video types at the limit and rejects wrong, empty and oversized files', () => {
  for (const type of ['video/mp4', 'video/webm', 'video/ogg']) {
    assert.doesNotThrow(() => validateMediaFile({ type, size: 3 * 1024 * 1024 }, 'video'));
  }
  for (const file of [{ type: 'image/png', size: 10 }, { type: 'video/mp4', size: 0 }, { type: 'video/mp4', size: 3 * 1024 * 1024 + 1 }]) {
    assert.throws(() => validateMediaFile(file, 'video'));
  }
  assert.doesNotThrow(() => validateMediaFile({ type: 'image/jpeg', size: 8 * 1024 * 1024 }, 'before'));
});

test('validates local data and direct URLs, including signed URLs', () => {
  assert.equal(validateVideoSource(video), video);
  assert.equal(validateVideoSource(' https://example.com/stream?signature=123 '), 'https://example.com/stream?signature=123');
  for (const source of ['', 'bad-url', 'javascript:alert(1)', 'data:text/html;base64,AAAA', 'data:video/mp4;base64,A', 'file:///video.mp4']) {
    assert.throws(() => validateVideoSource(source));
  }
  assert.throws(() => validateVideoSource('data:video/mp4;base64,' + 'AAAA'.repeat(1024 * 1024 + 1)));
});

test('requires details, valid rating and an image pair or video', () => {
  assert.throws(() => normalizeTransformation({ ...details, video, clientName: ' ' }));
  assert.throws(() => normalizeTransformation({ ...details, video, rating: 6 }));
  assert.throws(() => normalizeTransformation({ ...details, before: 'before.jpg' }));
});

test('video survives reload, replacement, image-mode conversion and deletion', async () => {
  const created = await createTransformation({ ...details, video, before: 'old.jpg', after: 'old.jpg' });
  assert.equal((await fetchTransformations())[0].video, video);
  assert.equal((await fetchTransformations())[0].before, '');
  await updateTransformation(created.id, { ...details, video: 'https://example.com/new.webm' });
  assert.equal((await fetchTransformations())[0].video, 'https://example.com/new.webm');
  await updateTransformation(created.id, { ...details, video: '', before: 'before.jpg', after: 'after.jpg' });
  assert.equal((await fetchTransformations())[0].video, '');
  assert.equal((await fetchTransformations())[0].after, 'after.jpg');
  await deleteTransformation(created.id);
  assert.deepEqual(await fetchTransformations(), []);
});

test('storage failure rejects writes and preserves previous records', async () => {
  const created = await createTransformation({ ...details, video });
  const previous = saved.get('admin_transformations');
  localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  await assert.rejects(createTransformation({ ...details, video }), /Could not save/);
  await assert.rejects(updateTransformation(created.id, { ...details, video }), /Could not save/);
  await assert.rejects(deleteTransformation(created.id), /Could not save/);
  assert.equal(saved.get('admin_transformations'), previous);
});

test('corrupt storage is not replaced by defaults during save', async () => {
  saved.set('admin_transformations', 'invalid json');
  await assert.rejects(createTransformation({ ...details, video }), /Could not read/);
  assert.equal(saved.get('admin_transformations'), 'invalid json');
});

test('before/after videos require a complete pair and apply video file limits', () => {
  assert.throws(() => normalizeTransformation({ ...details, beforeVideo: video }), /both Before and After/);
  for (const field of ['beforeVideo', 'afterVideo']) {
    assert.throws(() => validateMediaFile({ type: 'image/png', size: 100 }, field));
    assert.throws(() => validateMediaFile({ type: 'video/mp4', size: 3 * 1024 * 1024 + 1 }, field));
  }
});

test('video pairs persist, can be edited, and clear when switching media modes', async () => {
  const created = await createTransformation({ ...details, beforeVideo: video, afterVideo: video });
  let item = (await fetchTransformations())[0];
  assert.equal(item.beforeVideo, video);
  assert.equal(item.afterVideo, video);
  assert.equal(item.video, '');
  assert.equal(item.before, '');
  await updateTransformation(created.id, { ...item, afterVideo: 'https://example.com/after.webm' });
  item = (await fetchTransformations())[0];
  assert.equal(item.beforeVideo, video);
  assert.equal(item.afterVideo, 'https://example.com/after.webm');
  await updateTransformation(created.id, { ...details, video });
  item = (await fetchTransformations())[0];
  assert.equal(item.beforeVideo, '');
  assert.equal(item.afterVideo, '');
  assert.equal(item.video, video);
});

test('requested sample is added once, preserves existing entries and stays deleted', async () => {
  const existing = await createTransformation({ ...details, video });
  saved.delete('transformation_video_demo_added_v1');
  const list = await fetchTransformations();
  assert.equal(list.length, 2);
  assert.equal(list[0].id, 9000001);
  assert.equal(list[1].id, existing.id);
  assert.equal((await fetchTransformations()).length, 2);
  await deleteTransformation(9000001);
  assert.deepEqual((await fetchTransformations()).map(item => item.id), [existing.id]);
});

test('before/after demo is inserted once with both players and respects deletion', async () => {
  const existing = await createTransformation({ ...details, video });
  saved.delete('transformation_video_pair_demo_added_v1');
  const list = await fetchTransformations();
  assert.equal(list.length, 2);
  assert.equal(list[0].id, 9000002);
  assert.ok(list[0].beforeVideo);
  assert.ok(list[0].afterVideo);
  assert.equal(list[0].video, '');
  assert.equal(list[1].id, existing.id);
  assert.equal((await fetchTransformations()).length, 2);
  await deleteTransformation(9000002);
  assert.deepEqual((await fetchTransformations()).map(item => item.id), [existing.id]);
});
