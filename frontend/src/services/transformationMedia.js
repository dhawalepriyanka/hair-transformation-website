export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const MB = 1024 * 1024;
export const MAX_VIDEO_SIZE_MB = 100;
export const MAX_IMAGE_SIZE_MB = 15;

const blobUrlCache = new Map();

/**
 * Normalizes relative or direct media URLs:
 * - Converts base64 video data URIs to high-performance Blob Object URLs for seamless native playback
 * - Resolves relative /api/ and /uploads/ paths to canonical https://www.dipaliwakale.in on production
 * - Upgrades insecure http:// to https:// when on an HTTPS domain (prevents browser Mixed Content blocking)
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If base64 video data URI, convert to high-performance Blob Object URL for smooth native decoding & seeking
  if (trimmed.startsWith('data:video/')) {
    if (blobUrlCache.has(trimmed)) {
      return blobUrlCache.get(trimmed);
    }
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        const parts = trimmed.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'video/mp4';
        const binaryStr = atob(parts[1]);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mime });
        const objectUrl = URL.createObjectURL(blob);
        blobUrlCache.set(trimmed, objectUrl);
        return objectUrl;
      } catch (_) {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || isEmbeddableVideoUrl(trimmed)) {
    return trimmed;
  }

  // Canonical production domain for relative API & upload paths to avoid 308 redirect loops
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if ((host === 'dipaliwakale.in' || host === 'www.dipaliwakale.in') && trimmed.startsWith('/')) {
      return `https://www.dipaliwakale.in${trimmed}`;
    }
    // Upgrade http:// to https:// on secure pages
    if (window.location.protocol === 'https:' && trimmed.startsWith('http://')) {
      return trimmed.replace('http://', 'https://');
    }
  }
  return trimmed;
}

/**
 * Instagram Reel & Post Detection
 */
export function isInstagramUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|reels|tv|share)\/([A-Za-z0-9_-]+)/i.test(url.trim());
}

/**
 * Returns clean Instagram embed URL.
 * NOTE: Instagram embed endpoint ONLY accepts /p/{code}/embed/ for all posts, reels, and videos.
 */
export function getInstagramEmbedUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const match = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|reels|tv|share)\/([A-Za-z0-9_-]+)/i.exec(url.trim());
  if (match && match[1]) {
    const code = match[1];
    return `https://www.instagram.com/p/${code}/embed/captioned/`;
  }
  return '';
}

/**
 * YouTube & YouTube Shorts Detection
 */
export function isYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i.test(url.trim());
}

/**
 * Generates privacy-friendly, responsive YouTube embed URL with autoplay, loop, and no ads
 */
export function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const match = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i.exec(url.trim());
  if (match && match[1]) {
    const videoId = match[1];
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=0&loop=1&playlist=${videoId}&rel=0&playsinline=1&modestbranding=1`;
  }
  return '';
}

/**
 * Google Drive Video URL Detection
 */
export function isGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /drive\.google\.com\/(?:file\/d\/|open\?id=)([A-Za-z0-9_-]+)/i.test(url.trim());
}

export function getGoogleDriveEmbedUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const match = /drive\.google\.com\/(?:file\/d\/|open\?id=)([A-Za-z0-9_-]+)/i.exec(url.trim());
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return '';
}

/**
 * Vimeo Detection
 */
export function isVimeoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?([0-9]+)/i.test(url.trim());
}

export function getVimeoEmbedUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const match = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?([0-9]+)/i.exec(url.trim());
  if (match && match[1]) {
    return `https://player.vimeo.com/video/${match[1]}?autoplay=1&loop=1&muted=0`;
  }
  return '';
}

/**
 * General Embeddable Platform Video Check
 */
export function isEmbeddableVideoUrl(url) {
  return isInstagramUrl(url) || isYouTubeUrl(url) || isGoogleDriveUrl(url) || isVimeoUrl(url);
}

export function getEmbedVideoUrl(url) {
  if (isInstagramUrl(url)) return getInstagramEmbedUrl(url);
  if (isYouTubeUrl(url)) return getYouTubeEmbedUrl(url);
  if (isGoogleDriveUrl(url)) return getGoogleDriveEmbedUrl(url);
  if (isVimeoUrl(url)) return getVimeoEmbedUrl(url);
  return '';
}

export function getVideoPlatformType(url) {
  if (isInstagramUrl(url)) return 'instagram';
  if (isYouTubeUrl(url)) return 'youtube';
  if (isGoogleDriveUrl(url)) return 'googledrive';
  if (isVimeoUrl(url)) return 'vimeo';
  return 'direct';
}

export function validateMediaFile(file, field, customMaxMb) {
  const video = ['video', 'beforeVideo', 'afterVideo'].includes(field);
  if (video ? !VIDEO_TYPES.includes(file.type) : !file.type.startsWith('image/')) {
    throw new Error(video ? 'Choose an MP4, WebM, or Ogg video.' : 'Choose an image file.');
  }
  const limit = customMaxMb !== undefined ? customMaxMb : (video ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB);
  if (!file.size || file.size > limit * MB) {
    throw new Error(`Choose a non-empty ${video ? 'video' : 'image'} file no larger than ${limit}MB.`);
  }
}

export function validateVideoSource(source, customMaxMb) {
  if (typeof source !== 'string' || !source.trim()) {
    throw new Error('Choose a video file or paste a direct video URL.');
  }
  source = source.trim();
  if (isEmbeddableVideoUrl(source)) {
    return source;
  }
  if (source.startsWith('/')) {
    if (!/\.(mp4|webm|ogg)(\?.*)?$/i.test(source) && !source.startsWith('/uploads/') && !source.startsWith('/api/')) {
      throw new Error('Choose a valid MP4, WebM, or Ogg video path.');
    }
    return source;
  }
  if (source.startsWith('blob:')) {
    return source;
  }
  if (source.startsWith('data:')) {
    const match = /^data:(video\/(?:mp4|webm|ogg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(source);
    if (!match || match[2].length % 4 !== 0) {
      throw new Error('Choose a valid MP4, WebM, or Ogg video file.');
    }
    const bytes = match[2].length * 3 / 4 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
    validateMediaFile({ type: match[1], size: bytes }, 'video', customMaxMb);
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
  if (item.duration !== undefined && item.duration !== '' && item.duration !== null) {
    const parsedDuration = parseInt(item.duration, 10);
    item.duration = !isNaN(parsedDuration) && parsedDuration > 0 ? parsedDuration : undefined;
  }
  if (item.displayOrder !== undefined && item.displayOrder !== '' && item.displayOrder !== null) {
    const parsedOrder = parseInt(item.displayOrder, 10);
    item.displayOrder = !isNaN(parsedOrder) ? parsedOrder : undefined;
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
  } else if (item.image) {
    item.image = item.image.trim();
    item.video = '';
  } else {
    if (!item.before?.trim() || !item.after?.trim()) {
      throw new Error('Add both Before and After images, single Image, or choose Video instead.');
    }
    item.video = '';
  }
  item.beforeVideo = item.beforeVideo || '';
  item.afterVideo = item.afterVideo || '';
  return item;
}
