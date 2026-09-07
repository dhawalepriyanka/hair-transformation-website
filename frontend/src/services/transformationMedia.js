export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const MB = 1024 * 1024;

export function validateMediaFile(file, field) {
  const video = ['video', 'beforeVideo', 'afterVideo'].includes(field);
  if (video ? !VIDEO_TYPES.includes(file.type) : !file.type.startsWith('image/')) {
    throw new Error(video ? 'Choose an MP4, WebM, or Ogg video.' : 'Choose an image file.');
  }
  const limit = video ? 3 : 8;
  if (!file.size || file.size > limit * MB) {
    throw new Error(`Choose a non-empty ${video ? 'video' : 'image'} file no larger than ${limit}MB.`);
  }
}

export function validateVideoSource(source) {
  if (typeof source !== 'string' || !source.trim()) {
    throw new Error('Choose a video file or paste a direct video URL.');
  }
  source = source.trim();
  if (source.startsWith('data:')) {
    const match = /^data:(video\/(?:mp4|webm|ogg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(source);
    if (!match || match[2].length % 4 !== 0) {
      throw new Error('Choose a valid MP4, WebM, or Ogg video file.');
    }
    const bytes = match[2].length * 3 / 4 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
    validateMediaFile({ type: match[1], size: bytes }, 'video');
  } else {
    let url;
    try { url = new URL(source); } catch { /* Report the same useful error for invalid URLs. */ }
    if (!url || !['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('Enter a direct video URL beginning with https:// or http://.');
    }
  }
  return source;
}

export function normalizeTransformation(data) {
  const item = { ...data };
  for (const field of ['clientName', 'village', 'treatment']) {
    if (typeof item[field] !== 'string' || !item[field].trim()) {
      throw new Error('Client name, village / city, and treatment name are required.');
    }
    item[field] = item[field].trim();
  }
  item.rating = Number(item.rating);
  if (!Number.isInteger(item.rating) || item.rating < 1 || item.rating > 5) {
    throw new Error('Choose a star rating between 1 and 5.');
  }
  if (item.beforeVideo || item.afterVideo) {
    if (!item.beforeVideo || !item.afterVideo) throw new Error('Add both Before and After videos.');
    item.beforeVideo = validateVideoSource(item.beforeVideo);
    item.afterVideo = validateVideoSource(item.afterVideo);
    item.before = '';
    item.after = '';
    item.video = '';
  } else if (item.video) {
    item.video = validateVideoSource(item.video);
    item.before = '';
    item.after = '';
  } else {
    if (!item.before?.trim() || !item.after?.trim()) {
      throw new Error('Add both Before and After images, or choose Video instead.');
    }
    item.video = '';
  }
  item.beforeVideo = item.beforeVideo || '';
  item.afterVideo = item.afterVideo || '';
  return item;
}
