import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, ArrowLeft } from 'lucide-react';
import { fetchTransformations, fetchSlideshowSettings, fetchPublicPatientQueue } from '../services/api';
import {
  isInstagramUrl, getInstagramEmbedUrl,
  isYouTubeUrl, getYouTubeEmbedUrl,
  isGoogleDriveUrl, getGoogleDriveEmbedUrl,
  isVimeoUrl, getVimeoEmbedUrl,
  isEmbeddableVideoUrl, resolveMediaUrl
} from '../services/transformationMedia';
import VideoComparison from '../components/VideoComparison';
import PatientQueueSlide from '../components/PatientQueueSlide';

/* ═══════════════════════════════════════════════════════════════════
   DIPALI WAKALE TV — LUXURY SALON DIGITAL SIGNAGE SHOWCASE (16:9 1080p)
   ═══════════════════════════════════════════════════════════════════
   - Color Scheme: Dark Burgundy (#0A0305, #18080E), Black & Champagne Gold (#F2C9B6, #FFF2C9)
   - MODE A (Video / Single Media):
       • LEFT (20%): Clinic Branding + Scannable Website QR (https://www.dipaliwakale.in/)
       • CENTER (60%): Centered 9:16 Media + Compact Service Title Overlay + 3 Remote Controls
       • RIGHT (20%): Instagram Promo (@wakale_dipali_) + Scannable QR + Salon Contact Details
   - MODE B (Before & After Images/Videos):
       • Side panels automatically HIDE
       • Center panel expands to 100% full screen (50% Before | 50% After), aspect-ratio preserved
       • Side panels automatically RESTORE when next item is a video
   - Remote Controls: Exactly 3 buttons (Previous, Play/Pause, Next) with 4s auto-hide & D-pad focus
   - Monitor Fullscreen: Automatically expands to hardware full screen of monitor on load/gesture;
                         Back button / Escape cleanly exits to windowed view or home.
   - Data Sync: Automatically syncs with Admin Dashboard transformations & app resume
   ═══════════════════════════════════════════════════════════════════ */

const AUTOHIDE_DELAY_MS = 4000;     // auto-hide remote controls after 4s

// Cross-browser Fullscreen Helpers
const isDocumentFullscreen = () => {
  return typeof document !== 'undefined' && Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
};

const requestFullscreenOnElement = async (el) => {
  if (!el) return;
  if (el.requestFullscreen) {
    return el.requestFullscreen();
  } else if (el.webkitRequestFullscreen) {
    return el.webkitRequestFullscreen();
  } else if (el.mozRequestFullScreen) {
    return el.mozRequestFullScreen();
  } else if (el.msRequestFullscreen) {
    return el.msRequestFullscreen();
  }
};

const exitFullscreenOnDoc = async () => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      await document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen();
    }
  } catch (err) {
    console.warn('Exit fullscreen failed:', err);
  }
};

const TransformationsPage = () => {
  const [transformationsList, setTransformationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideshowSettings, setSlideshowSettings] = useState(() => fetchSlideshowSettings());
  const [isPlaying, setIsPlaying] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [focusedButton, setFocusedButton] = useState(1); // 0: Prev, 1: Play/Pause, 2: Next
  const [progressPercent, setProgressPercent] = useState(0);
  const [patientQueue, setPatientQueue] = useState([]);

  // Hardware Monitor Fullscreen state
  const [isMonitorFullscreen, setIsMonitorFullscreen] = useState(() => isDocumentFullscreen());
  const hasUserExitedFullscreenRef = useRef(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Horizontal (16:9 landscape) video detection to acquire 100% full screen
  const [isVideoHorizontal, setIsVideoHorizontal] = useState(false);
  const videoOrientationCacheRef = useRef({});
  const activeSlideRef = useRef(0);

  // Live Clinic Clock & Date for digital signage header
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const videoRef = useRef(null);
  const ambientVideoRef = useRef(null);
  const prevBtnRef = useRef(null);
  const playBtnRef = useRef(null);
  const nextBtnRef = useRef(null);
  const slideTimerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const cursorTimerRef = useRef(null);
  const videoErrorTimerRef = useRef(null);
  const transformationsListRef = useRef([]);

  // Keep refs synchronized with state for callback access
  useEffect(() => {
    activeSlideRef.current = activeSlide;
  }, [activeSlide]);

  useEffect(() => {
    transformationsListRef.current = transformationsList;
  }, [transformationsList]);

  // Live clinic clock (ticks every second)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync Live Patient Waiting List from Receptionist Queue
  const syncQueue = useCallback(async () => {
    try {
      const q = await fetchPublicPatientQueue();
      if (Array.isArray(q)) {
        setPatientQueue(q);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    syncQueue();
    const queueInterval = setInterval(syncQueue, 5000);

    const handleQueueChange = (e) => {
      if (e?.detail) setPatientQueue(e.detail);
      else syncQueue();
    };
    window.addEventListener('patient_queue_changed', handleQueueChange);

    const handleQueueStorage = (e) => {
      if (!e.key || e.key === 'clinic_patient_queue' || e.key === 'clinic_all_visits') {
        syncQueue();
      }
    };
    window.addEventListener('storage', handleQueueStorage);

    let queueBc = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        queueBc = new BroadcastChannel('dipali_queue_sync');
        queueBc.onmessage = (msg) => {
          if (msg.data?.queue) setPatientQueue(msg.data.queue);
          else syncQueue();
        };
      } catch (_) {}
    }

    return () => {
      clearInterval(queueInterval);
      window.removeEventListener('patient_queue_changed', handleQueueChange);
      window.removeEventListener('storage', handleQueueStorage);
      if (queueBc) {
        try { queueBc.close(); } catch (_) {}
      }
    };
  }, [syncQueue]);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  // 1. Data Synchronization with Admin Dashboard (Periodical + App Resume)
  const syncTransformations = useCallback(async () => {
    try {
      const data = await fetchTransformations();
      const rawList = Array.isArray(data) ? data : [];

      // 1. Filter out obsolete/legacy demo placeholders (only dummy Unsplash stock photos, never real clinic content)
      const legacyDemoIds = new Set(['1', '2', '3', '4', '5', '6', '9000001', '9000002']);

      const published = rawList.filter((item) => {
        if (!item) return false;
        const str = JSON.stringify(item);
        const isDummyStock = legacyDemoIds.has(String(item.id)) && (
          str.includes('images.unsplash.com') ||
          item.clientName === 'Old stock entry' ||
          item.clientName === 'Video Demo' ||
          item.clientName === 'Before & After Video Demo'
        );
        if (isDummyStock) return false;
        if (item.is_published === false || item.status === 'draft' || item.published === false) {
          return false;
        }
        return Boolean(
          item.video ||
          item.image ||
          (item.before && item.after) ||
          (item.beforeVideo && item.afterVideo)
        );
      });

      // 2. Deduplicate items by ID
      const seenIds = new Set();
      const uniqueItems = [];
      for (const item of published) {
        const idStr = String(item.id);
        if (!seenIds.has(idStr)) {
          seenIds.add(idStr);
          uniqueItems.push(item);
        }
      }

      // 3. Put custom admin uploads first, followed by all clinic published reels and transformations
      const sortedItems = [...uniqueItems].sort((a, b) => {
        const aIsCustom = !(Number(a.id) >= 9100001 && Number(a.id) <= 9100099);
        const bIsCustom = !(Number(b.id) >= 9100001 && Number(b.id) <= 9100099);
        if (aIsCustom && !bIsCustom) return -1;
        if (!aIsCustom && bIsCustom) return 1;
        return (a.displayOrder || 0) - (b.displayOrder || 0);
      });

      // 4. Inject Live Patient Waiting List Slide into the TV rotation (driven by Admin Settings)
      const shouldShowQueue = slideshowSettings.showPatientQueueSlide !== false;
      const queueDuration = Math.max(3, parseInt(slideshowSettings.queueSlideDuration, 10) || 7);
      const queuePlacement = slideshowSettings.queueSlidePlacement || 'repeat';
      const queueFreq = Math.max(1, parseInt(slideshowSettings.queueSlideFrequency, 10) || 2);
      const queueSpecificIndex = Math.max(1, parseInt(slideshowSettings.queueSlideSpecificIndex, 10) || 1);

      const itemsWithQueue = [];

      if (!shouldShowQueue) {
        itemsWithQueue.push(...sortedItems);
      } else {
        const createQueueSlide = (keySuffix = '') => ({
          id: `__PATIENT_WAITING_LIST__${keySuffix}`,
          isQueueSlide: true,
          treatment: 'Live Patient Waiting List',
          clientName: 'Patient Queue & Status',
          duration: queueDuration
        });

        if (sortedItems.length === 0) {
          itemsWithQueue.push(createQueueSlide());
        } else if (queuePlacement === 'first') {
          // Slide #1: Waiting list first
          itemsWithQueue.push(createQueueSlide());
          itemsWithQueue.push(...sortedItems);
        } else if (queuePlacement === 'last') {
          // At the end of rotation
          itemsWithQueue.push(...sortedItems);
          itemsWithQueue.push(createQueueSlide());
        } else if (queuePlacement === 'specific') {
          // Specific slide position (1-based index)
          const insertIdx = Math.min(Math.max(0, queueSpecificIndex - 1), sortedItems.length);
          itemsWithQueue.push(...sortedItems);
          itemsWithQueue.splice(insertIdx, 0, createQueueSlide());
        } else {
          // 'repeat' mode: repeat after every N transformation reels throughout rotation
          let queueCount = 0;
          for (let i = 0; i < sortedItems.length; i++) {
            itemsWithQueue.push(sortedItems[i]);
            if ((i + 1) % queueFreq === 0 && i !== sortedItems.length - 1) {
              queueCount++;
              itemsWithQueue.push(createQueueSlide(`_${queueCount}`));
            }
          }
          if (sortedItems.length <= queueFreq) {
            itemsWithQueue.push(createQueueSlide());
          }
        }
      }

      setTransformationsList(itemsWithQueue);

      // Preserve active transformation if it still exists after reload/sync
      setActiveSlide((currSlide) => {
        if (itemsWithQueue.length === 0) return 0;
        const currentPlayingItem = transformationsListRef.current[currSlide];
        if (currentPlayingItem) {
          const matchingIdx = itemsWithQueue.findIndex((i) => String(i.id) === String(currentPlayingItem.id));
          if (matchingIdx !== -1) return matchingIdx;
        }
        return currSlide >= itemsWithQueue.length ? 0 : currSlide;
      });
    } catch (e) {
      console.warn('Failed to sync transformations:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load, real-time sync, and settings listener
  useEffect(() => {
    syncTransformations();

    // 5s background sync with database/admin dashboard for TV APK and external devices
    const syncInterval = setInterval(syncTransformations, 5000);

    // Instant real-time update listeners across tabs and components
    const handleImmediateSync = () => {
      syncTransformations();
    };

    // 1. Same-tab CustomEvent
    window.addEventListener('transformations_changed', handleImmediateSync);

    // 2. Cross-tab BroadcastChannel for zero-latency sync
    let bc = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('dipali_transformations_sync');
        bc.onmessage = handleImmediateSync;
      } catch (_) {}
    }

    // 3. Cross-tab localStorage event listener
    const handleStorageChange = (e) => {
      if (!e.key || e.key === 'admin_transformations' || e.key === 'admin_transformations_last_updated') {
        syncTransformations();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // App Resume listeners: visibilitychange, window focus, online
    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        syncTransformations();
      }
    };
    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', syncTransformations);
    window.addEventListener('online', syncTransformations);

    const handleSettingsChanged = (e) => {
      if (e.detail) {
        setSlideshowSettings(e.detail);
      }
    };
    window.addEventListener('slideshow_settings_changed', handleSettingsChanged);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('transformations_changed', handleImmediateSync);
      if (bc) {
        try { bc.close(); } catch (_) {}
      }
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', syncTransformations);
      window.removeEventListener('online', syncTransformations);
      window.removeEventListener('slideshow_settings_changed', handleSettingsChanged);
    };
  }, [syncTransformations]);

  const activeItem = transformationsList[activeSlide];
  const isVideo = Boolean(activeItem?.video || activeItem?.beforeVideo);

  // Automatically detect Before & After mode (hides side panels and expands to 100% full screen)
  const isBeforeAfter = Boolean(
    (activeItem?.before && activeItem?.after) ||
    (activeItem?.beforeVideo && activeItem?.afterVideo)
  );

  // Pre-probe orientation of all video items to eliminate layout shifts
  useEffect(() => {
    transformationsList.forEach((item) => {
      const src = item?.video;
      if (src && videoOrientationCacheRef.current[src] === undefined) {
        if (src.includes('/instagram/reels/') || isInstagramUrl(src)) {
          videoOrientationCacheRef.current[src] = false;
        } else if (isYouTubeUrl(src)) {
          const isShort = src.includes('/shorts/');
          videoOrientationCacheRef.current[src] = !isShort;
        } else if (isGoogleDriveUrl(src) || isVimeoUrl(src)) {
          videoOrientationCacheRef.current[src] = false;
        } else {
          const probe = document.createElement('video');
          probe.preload = 'metadata';
          probe.src = resolveMediaUrl(src);
          probe.onloadedmetadata = () => {
            if (probe.videoWidth && probe.videoHeight) {
              const isH = probe.videoWidth > probe.videoHeight;
              videoOrientationCacheRef.current[src] = isH;
              const currentActive = transformationsListRef.current[activeSlideRef.current];
              if (currentActive?.video === src) {
                setIsVideoHorizontal(isH);
              }
            }
          };
        }
      }
    });
  }, [transformationsList]);

  // Update horizontal video state when active item/slide changes
  useEffect(() => {
    if (!activeItem) return;
    const currentVideo = activeItem.video;
    if (currentVideo) {
      if (videoOrientationCacheRef.current[currentVideo] !== undefined) {
        setIsVideoHorizontal(videoOrientationCacheRef.current[currentVideo]);
      } else if (currentVideo.includes('/instagram/reels/') || isInstagramUrl(currentVideo)) {
        videoOrientationCacheRef.current[currentVideo] = false;
        setIsVideoHorizontal(false);
      } else if (isYouTubeUrl(currentVideo)) {
        const isShort = currentVideo.includes('/shorts/');
        videoOrientationCacheRef.current[currentVideo] = !isShort;
        setIsVideoHorizontal(!isShort);
      } else if (videoRef.current && videoRef.current.videoWidth && videoRef.current.videoHeight) {
        const isH = videoRef.current.videoWidth > videoRef.current.videoHeight;
        videoOrientationCacheRef.current[currentVideo] = isH;
        setIsVideoHorizontal(isH);
      }
    } else {
      setIsVideoHorizontal(false);
    }
  }, [activeSlide, activeItem]);

  const handleVideoLoadedMetadata = (e) => {
    const v = e.target;
    if (v && v.videoWidth && v.videoHeight) {
      const isH = v.videoWidth > v.videoHeight;
      if (activeItem?.video) {
        videoOrientationCacheRef.current[activeItem.video] = isH;
      }
      setIsVideoHorizontal(isH);
    }
  };

  // Full-screen mode:
  // 1. Live Patient Waiting List Slide (100% full screen luxury dashboard)
  // 2. Before & After comparison (Images or Videos)
  // 3. Horizontal / Landscape video (acquires 100% full screen width, hiding side panels)
  const isFullScreen = Boolean(
    activeItem?.isQueueSlide ||
    isBeforeAfter ||
    (isVideo && isVideoHorizontal)
  );

  const treatmentTitle = activeItem?.treatment || activeItem?.clientName || activeItem?.category || 'Hair & Skin Transformation';
  const treatmentSubtitle = activeItem?.treatment && activeItem?.clientName && activeItem.treatment !== activeItem.clientName
    ? activeItem.clientName
    : (activeItem?.category || (activeItem?.village ? `Clinic • ${activeItem.village}` : null));

  // Preload next video/image for seamless flicker-free transitions
  const nextSlideIndex = transformationsList.length > 0 ? (activeSlide + 1) % transformationsList.length : 0;
  const nextItem = transformationsList[nextSlideIndex];

  // Timing calculation: 7s for images, 7s for waiting list, video plays until end
  const calculateSlideDuration = useCallback(() => {
    if (!activeItem) return 7;

    // 1. Patient Waiting List slide display duration (defaults to 7s)
    if (activeItem.isQueueSlide) {
      return parseInt(slideshowSettings.queueSlideDuration, 10) || 7;
    }

    // 2. Video timing:
    // If video is played, next video starts after the first video has ended
    if (isVideo) {
      const isEmbed = isEmbeddableVideoUrl(activeItem.video);
      if (!isEmbed) {
        // Native HTML5 video: plays to the end!
        if (slideshowSettings.videoDurationMode === 'end' || !slideshowSettings.videoDurationMode) {
          return 'end';
        }
      } else {
        // External iframe embed (Instagram, YouTube, Drive):
        if (activeItem.duration && !isNaN(activeItem.duration) && activeItem.duration > 0) {
          return parseInt(activeItem.duration, 10);
        }
        return parseInt(slideshowSettings.videoDuration, 10) || 15;
      }
    }

    // 3. Individual item custom duration if explicitly set
    if (activeItem.duration && !isNaN(activeItem.duration) && activeItem.duration > 0) {
      return parseInt(activeItem.duration, 10);
    }

    // 4. Photo & Before/After Image slides (defaults to 7s)
    return parseInt(slideshowSettings.imageDuration, 10) || 7;
  }, [activeItem, isVideo, slideshowSettings]);

  // Slide navigation with infinite wrap (always references latest transformations list)
  const changeSlide = useCallback((direction) => {
    const list = transformationsListRef.current;
    if (!list || list.length === 0) return;
    setActiveSlide((current) => (current + direction + list.length) % list.length);
  }, []);

  // Inactivity Auto-Hide for floating controls (4 seconds)
  const wakeControls = useCallback(() => {
    setControlsVisible(true);
    setCursorVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);

    controlsTimerRef.current = setTimeout(() => {
      setIsPlaying((currPlaying) => {
        if (currPlaying) {
          setControlsVisible(false);
        }
        return currPlaying;
      });
    }, AUTOHIDE_DELAY_MS);

    cursorTimerRef.current = setTimeout(() => {
      setCursorVisible(false);
    }, 2500);
  }, []);

  // Previous slide action
  const handlePrevious = useCallback((e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    changeSlide(-1);
    setFocusedButton(0);
    wakeControls();
  }, [changeSlide, wakeControls]);

  // Next slide action
  const handleNext = useCallback((e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    changeSlide(1);
    setFocusedButton(2);
    wakeControls();
  }, [changeSlide, wakeControls]);

  // Toggle Play / Pause action
  const handleTogglePlayPause = useCallback((e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setIsPlaying((prev) => {
      const nextState = !prev;
      if (!nextState) {
        setControlsVisible(true);
      }
      return nextState;
    });
    setFocusedButton(1);
    wakeControls();
  }, [wakeControls]);

  // Enter hardware monitor fullscreen
  const enterMonitorFullscreen = useCallback(async () => {
    try {
      hasUserExitedFullscreenRef.current = false;
      setHasUserInteracted(true);
      if (!isDocumentFullscreen()) {
        await requestFullscreenOnElement(document.documentElement);
        try {
          if (!window.history.state?.tvFullscreen) {
            window.history.pushState({ tvFullscreen: true }, '');
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Monitor fullscreen request requires user interaction:', err?.message);
    }
  }, []);

  // Back action: if in monitor fullscreen -> exit to windowed screenshot page; otherwise navigate back
  const handleBackAction = useCallback((e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setHasUserInteracted(true);

    if (isDocumentFullscreen()) {
      hasUserExitedFullscreenRef.current = true;
      exitFullscreenOnDoc();
      if (window.history.state?.tvFullscreen) {
        window.history.back();
      }
      return;
    }

    // Not in monitor fullscreen, navigate back to salon website or home
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  }, []);

  // Monitor fullscreen synchronization & auto-fullscreen attempt on load
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = isDocumentFullscreen();
      setIsMonitorFullscreen(isFs);
      if (!isFs) {
        hasUserExitedFullscreenRef.current = true;
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    const handlePopState = () => {
      if (isDocumentFullscreen()) {
        hasUserExitedFullscreenRef.current = true;
        exitFullscreenOnDoc();
      }
    };
    window.addEventListener('popstate', handlePopState);

    // 1. Attempt silent fullscreen immediately on mount (works when navigated from a click or TV app)
    if (!isDocumentFullscreen()) {
      requestFullscreenOnElement(document.documentElement)
        .then(() => {
          try {
            if (!window.history.state?.tvFullscreen) {
              window.history.pushState({ tvFullscreen: true }, '');
            }
          } catch (_) {}
        })
        .catch(() => {
          // Expected in Chrome/Edge if URL was entered directly into address bar without prior click
        });
    }

    // 2. Seamlessly enter full screen on any user interaction anywhere on the screen
    const handleAutoFullscreen = () => {
      if (!isDocumentFullscreen()) {
        enterMonitorFullscreen();
      }
    };

    window.addEventListener('pointerdown', handleAutoFullscreen);
    window.addEventListener('click', handleAutoFullscreen);
    window.addEventListener('keydown', handleAutoFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pointerdown', handleAutoFullscreen);
      window.removeEventListener('click', handleAutoFullscreen);
      window.removeEventListener('keydown', handleAutoFullscreen);
    };
  }, [enterMonitorFullscreen]);

  // Synchronize actual video playback with isPlaying state
  useEffect(() => {
    if (videoRef.current && isVideo && !isEmbeddableVideoUrl(activeItem?.video)) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
    if (ambientVideoRef.current && activeItem?.video && !isEmbeddableVideoUrl(activeItem.video)) {
      if (isPlaying) {
        ambientVideoRef.current.play().catch(() => {});
      } else {
        ambientVideoRef.current.pause();
      }
    }
  }, [isPlaying, isVideo, activeItem]);

  // Video reset on slide transition
  useEffect(() => {
    if (videoErrorTimerRef.current) {
      clearTimeout(videoErrorTimerRef.current);
      videoErrorTimerRef.current = null;
    }
    if (videoRef.current && isVideo && !isEmbeddableVideoUrl(activeItem?.video)) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false; // Always try with audio on slide change
      if (isPlaying) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Browser blocked autoplay with sound → fall back to muted
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
    if (ambientVideoRef.current && activeItem?.video && !isEmbeddableVideoUrl(activeItem.video)) {
      ambientVideoRef.current.currentTime = 0;
      if (isPlaying) {
        ambientVideoRef.current.play().catch(() => {});
      } else {
        ambientVideoRef.current.pause();
      }
    }
  }, [activeSlide, isVideo]);

  // Video progress time tracking
  const handleVideoTimeUpdate = (e) => {
    const vid = e.target;
    if (vid && vid.duration) {
      setProgressPercent((vid.currentTime / vid.duration) * 100);
    }
  };

  // Video loading error handling (graceful fallback - no 0ms disappearance)
  const handleVideoError = useCallback((e) => {
    console.warn('Video playback notice for slide:', activeItem?.video || activeItem?.image, e);
    // 1. Try muted if browser blocked unmuted autoplay
    if (videoRef.current && !videoRef.current.muted) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
      return;
    }
    // 2. Give user 4s to view slide info before advancing
    if (videoErrorTimerRef.current) clearTimeout(videoErrorTimerRef.current);
    videoErrorTimerRef.current = setTimeout(() => {
      if (isPlaying && transformationsListRef.current.length > 1) {
        changeSlide(1);
      }
    }, 4000);
  }, [activeItem?.video, activeItem?.image, changeSlide, isPlaying]);

  // Track progress line for non-video or embeddable platform slides
  useEffect(() => {
    setProgressPercent(0);
    if (isVideo && !isEmbeddableVideoUrl(activeItem?.video)) return;
    const duration = calculateSlideDuration();
    const totalMs = (Number(duration) || 8) * 1000;
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (!isPlaying) return;
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / totalMs) * 100);
      setProgressPercent(pct);
    }, 100);
    return () => clearInterval(interval);
  }, [activeSlide, isVideo, isPlaying, calculateSlideDuration, activeItem]);

  // Handle video end: immediately advance to next slide/video as requested
  const handleVideoEnded = () => {
    if (isPlaying) {
      changeSlide(1);
    }
  };

  // Auto-advance slideshow timer (honors admin autoSwitch setting)
  useEffect(() => {
    if (slideTimerRef.current) {
      clearInterval(slideTimerRef.current);
      slideTimerRef.current = null;
    }

    if (!slideshowSettings.autoSwitch || !isPlaying || transformationsList.length < 2 || !activeItem) {
      return;
    }

    const duration = calculateSlideDuration();

    if (duration === 'end') {
      // Video is playing to the end naturally. Safety watchdog of 5 min in case stream stalls
      slideTimerRef.current = window.setTimeout(() => {
        changeSlide(1);
      }, 300000);
      return () => clearTimeout(slideTimerRef.current);
    }

    const durationMs = (Number(duration) || 7) * 1000;

    slideTimerRef.current = window.setInterval(() => {
      changeSlide(1);
    }, durationMs);

    return () => {
      if (slideTimerRef.current) {
        clearInterval(slideTimerRef.current);
        slideTimerRef.current = null;
      }
    };
  }, [activeSlide, isPlaying, transformationsList.length, calculateSlideDuration, changeSlide, activeItem, slideshowSettings.autoSwitch]);

  // TV Remote Navigation (D-Pad & Media Keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      wakeControls();

      // 1. LEFT: Previous
      if (e.key === 'ArrowLeft' || e.key === 'MediaTrackPrevious' || e.key === 'MediaRewind' || e.key === 'ChannelDown') {
        e.preventDefault();
        setFocusedButton(0);
        handlePrevious();
      }
      // 2. RIGHT: Next
      else if (e.key === 'ArrowRight' || e.key === 'MediaTrackNext' || e.key === 'MediaFastForward' || e.key === 'ChannelUp') {
        e.preventDefault();
        setFocusedButton(2);
        handleNext();
      }
      // 3. OK / ENTER / SPACE / MEDIA PLAY PAUSE
      else if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space' || e.key === 'MediaPlayPause' || e.key === 'Select') {
        e.preventDefault();
        if (focusedButton === 0) {
          handlePrevious();
        } else if (focusedButton === 2) {
          handleNext();
        } else {
          handleTogglePlayPause();
        }
      }
      // 4. DEDICATED MEDIA PLAY
      else if (e.key === 'MediaPlay') {
        e.preventDefault();
        setIsPlaying(true);
      }
      // 5. DEDICATED MEDIA PAUSE
      else if (e.key === 'MediaPause') {
        e.preventDefault();
        setIsPlaying(false);
        setControlsVisible(true);
      }
      // 6. UP / DOWN: Wake up controls and focus Play/Pause
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedButton(1);
        setControlsVisible(true);
      }
      // 7. BACK / ESCAPE / REMOTE BACK (Code 4 / 27 / 10009)
      else if (e.key === 'Escape' || e.key === 'Back' || e.key === 'BrowserBack' || e.keyCode === 10009 || e.keyCode === 27 || e.keyCode === 4) {
        e.preventDefault();
        handleBackAction(e);
      }
      // 8. F KEY / F11: Fullscreen Toggle
      else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (isDocumentFullscreen()) {
          handleBackAction(e);
        } else {
          enterMonitorFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controlsVisible, focusedButton, handlePrevious, handleNext, handleTogglePlayPause, handleBackAction, enterMonitorFullscreen, wakeControls]);

  // Sync DOM focus to active button for native Android TV webview D-pad
  useEffect(() => {
    if (!controlsVisible) return;
    if (focusedButton === 0) {
      prevBtnRef.current?.focus();
    } else if (focusedButton === 1) {
      playBtnRef.current?.focus();
    } else if (focusedButton === 2) {
      nextBtnRef.current?.focus();
    }
  }, [controlsVisible, focusedButton]);

  // Android WebView Bridge Support
  useEffect(() => {
    window.onTvRemoteKey = (action) => {
      wakeControls();
      if (action === 'left' || action === 'prev') {
        setFocusedButton(0);
        handlePrevious();
      } else if (action === 'right' || action === 'next') {
        setFocusedButton(2);
        handleNext();
      } else if (action === 'ok' || action === 'play_pause' || action === 'center') {
        handleTogglePlayPause();
      } else if (action === 'up' || action === 'down') {
        setFocusedButton(1);
        setControlsVisible(true);
      } else if (action === 'back' || action === 'escape') {
        handleBackAction();
      }
    };
    return () => {
      delete window.onTvRemoteKey;
    };
  }, [handlePrevious, handleNext, handleTogglePlayPause, handleBackAction, wakeControls]);

  // Mouse activity listener to show controls and auto-hide
  useEffect(() => {
    const handleMouseMove = () => {
      wakeControls();
    };
    window.addEventListener('mousemove', handleMouseMove);
    wakeControls();
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
    };
  }, [wakeControls]);

  return (
    <div className={`tv-apk-root ${!cursorVisible ? 'tv-cursor-hidden' : ''}`}>
      {/* Hidden preloader for next video to eliminate transition lag/flicker */}
      {nextItem?.video && !isEmbeddableVideoUrl(nextItem.video) && (
        <video
          src={resolveMediaUrl(nextItem.video)}
          preload="auto"
          muted
          playsInline
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      )}

      {loading ? (
        <div className="tv-loading-signage">
          <div className="tv-loading-emblem">✂</div>
          <div className="tv-loading-brand">DIPALI WAKALE</div>
          <div className="tv-loading-sub">HAIR &amp; SKIN CARE CLINIC</div>
          <div className="tv-loading-spinner" />
          <p className="tv-loading-text">Loading Transformations...</p>
        </div>
      ) : activeItem ? (
        <div className={`tv-apk-layout ${isFullScreen ? 'tv-layout-fullscreen' : ''}`}>

          {/* ══════════════════════════════════════════════════════
               LEFT PANEL (20%) — Salon Branding & Scannable Website QR
               Hidden when in Fullscreen Mode (Horizontal Video or Before & After)
             ══════════════════════════════════════════════════════ */}
          {!isFullScreen && (
            <div className="tv-apk-panel tv-apk-left-panel">
              {/* Luxury Digital Clinic Live Clock Header */}
              <div className="tv-apk-clock-header">
                <div className="tv-apk-clock-time">{formattedTime}</div>
                <div className="tv-apk-clock-date">{formattedDate}</div>
              </div>

              {/* Salon Branding Lockup */}
              <div className="tv-apk-branding-section">
                <div className="tv-apk-scissors-icon">✂</div>
                <h2 className="tv-apk-brand-title">
                  DIPALI<br />WAKALE
                </h2>
                <div className="tv-apk-divider" />
                <p className="tv-apk-brand-clinic">
                  HAIR &amp; SKIN CARE<br />CLINIC
                </p>
                <div className="tv-apk-divider-subtle" />
                <p className="tv-apk-brand-tagline">&ldquo;Your Hair, Our Art&rdquo;</p>
                <div className="tv-apk-stars">✦ &nbsp;✦ &nbsp;✦</div>
              </div>

              {/* Real Scannable Website QR Code Card */}
              <div className="tv-apk-qr-section">
                <div className="tv-apk-qr-kicker">SCAN TO EXPLORE</div>
                <div className="tv-apk-qr-heading">OUR SERVICES</div>
                <div className="tv-apk-qr-box">
                  <img
                    src="/brand/website-qr.svg"
                    alt="Scan for Dipali Wakale Website"
                    className="tv-apk-qr-img"
                  />
                </div>
                <div className="tv-apk-qr-link">www.dipaliwakale.in</div>
                <div className="tv-apk-scan-sub">Book Appointment &bull; Gallery</div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
               CENTER PANEL (60% or 100% in Fullscreen / Horizontal Video Mode)
               Transformation Media + Floating Overlay Controls
             ══════════════════════════════════════════════════════ */}
          <div className={`tv-apk-center-panel ${isFullScreen ? 'tv-fullscreen-mode' : ''}`}>
            {/* Compact Service Title Overlay at Top (hidden on Patient Queue slide) */}
            {treatmentTitle && !activeItem?.isQueueSlide && (
              <div className="tv-apk-treatment-overlay tv-apk-fade-in" key={`badge-${activeSlide}`}>
                <span className="tv-apk-overlay-sparkle">✨</span>
                <div className="tv-apk-overlay-content">
                  <div className="tv-apk-overlay-title">{treatmentTitle}</div>
                  <div className="tv-apk-overlay-sub">
                    <span>By Dipali Wakale</span>
                    {treatmentSubtitle && <span> &bull; {treatmentSubtitle}</span>}
                    {activeItem?.period && <span> &bull; {activeItem.period}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Ambient Blurred Backdrop for vertical reels */}
            {!activeItem?.isQueueSlide && activeItem.video && !isEmbeddableVideoUrl(activeItem.video) ? (
              <video
                ref={ambientVideoRef}
                className="tv-apk-ambient-backdrop"
                src={resolveMediaUrl(activeItem.video)}
                muted
                autoPlay
                loop
                playsInline
                aria-hidden="true"
              />
            ) : !activeItem?.isQueueSlide && activeItem.image ? (
              <img className="tv-apk-ambient-backdrop" src={resolveMediaUrl(activeItem.image)} alt="" aria-hidden="true" />
            ) : null}

            {/* Foreground Main Media */}
            {activeItem?.isQueueSlide ? (
              <PatientQueueSlide queue={patientQueue} duration={calculateSlideDuration()} />
            ) : activeItem.beforeVideo && activeItem.afterVideo ? (
              <VideoComparison
                before={resolveMediaUrl(activeItem.beforeVideo)}
                after={resolveMediaUrl(activeItem.afterVideo)}
                clientName={activeItem.clientName}
              />
            ) : isInstagramUrl(activeItem.video) ? (
              <div
                key={activeItem.video}
                className="tv-apk-main-video tv-apk-insta-container"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'transparent'
                }}
              >
                <iframe
                  src={getInstagramEmbedUrl(activeItem.video)}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '480px',
                    border: 'none',
                    borderRadius: '16px'
                  }}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title={activeItem.clientName || 'Instagram Reel'}
                />
              </div>
            ) : isYouTubeUrl(activeItem.video) ? (
              <div
                key={activeItem.video}
                className="tv-apk-main-video tv-apk-youtube-container"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'transparent'
                }}
              >
                <iframe
                  src={getYouTubeEmbedUrl(activeItem.video)}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: isVideoHorizontal ? '960px' : '480px',
                    aspectRatio: isVideoHorizontal ? '16/9' : '9/16',
                    border: 'none',
                    borderRadius: '16px'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeItem.clientName || 'YouTube Video'}
                />
              </div>
            ) : isGoogleDriveUrl(activeItem.video) ? (
              <div
                key={activeItem.video}
                className="tv-apk-main-video tv-apk-drive-container"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'transparent'
                }}
              >
                <iframe
                  src={getGoogleDriveEmbedUrl(activeItem.video)}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '850px',
                    border: 'none',
                    borderRadius: '16px'
                  }}
                  allow="autoplay"
                  allowFullScreen
                  title={activeItem.clientName || 'Google Drive Video'}
                />
              </div>
            ) : isVimeoUrl(activeItem.video) ? (
              <div
                key={activeItem.video}
                className="tv-apk-main-video tv-apk-vimeo-container"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'transparent'
                }}
              >
                <iframe
                  src={getVimeoEmbedUrl(activeItem.video)}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '16px'
                  }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={activeItem.clientName || 'Vimeo Video'}
                />
              </div>
            ) : activeItem.video ? (
              <video
                ref={videoRef}
                key={activeItem.video}
                className="tv-apk-main-video"
                src={resolveMediaUrl(activeItem.video)}
                poster={
                  activeItem.poster || activeItem.after || activeItem.image ||
                  (String(activeItem.id) === '9100001' ? '/instagram/hair-transformation-client.jpg' :
                   String(activeItem.id) === '9100002' ? '/instagram/long-hair-styling.jpg' :
                   String(activeItem.id) === '9100003' ? '/instagram/salon-client.jpg' :
                   '/instagram/dipali-wakale-portrait.jpg')
                }
                controls={false}
                autoPlay
                loop={calculateSlideDuration() !== 'end'}
                playsInline
                onLoadedMetadata={handleVideoLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                onError={handleVideoError}
              >
                Your browser does not support video playback.
              </video>
            ) : activeItem.before && activeItem.after ? (
              /* Mode B: Full-Screen 50% Before | 50% After Comparison (Side panels hidden) */
              <div className="tv-apk-before-after-container">
                <div className="tv-apk-ba-side">
                  <img src={activeItem.before} alt="Before" className="tv-apk-ba-img" onError={handleVideoError} />
                  <span className="tv-apk-ba-label tv-apk-ba-before">BEFORE</span>
                </div>
                <div className="tv-apk-ba-divider" />
                <div className="tv-apk-ba-side">
                  <img src={activeItem.after} alt="After" className="tv-apk-ba-img" onError={handleVideoError} />
                  <span className="tv-apk-ba-label tv-apk-ba-after">AFTER</span>
                </div>
              </div>
            ) : activeItem.image ? (
              <img
                className="tv-apk-main-image"
                src={resolveMediaUrl(activeItem.image)}
                alt={activeItem.clientName || 'Transformation'}
                onError={handleVideoError}
              />
            ) : null}

            {/* ── WHISPER-THIN CHAMPAGNE GOLD TIMELINE (Progress Bar) ── */}
            <div className="tv-apk-progress-track">
              <div
                className="tv-apk-progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* ── SMALL FLOATING CONTROLS (Exactly 3 Buttons: Previous, Play/Pause, Next) ── */}
            <div
              className={`tv-apk-floating-controls ${controlsVisible ? 'visible' : 'hidden'}`}
              role="toolbar"
              aria-label="Remote Playback Controls"
            >
              {/* 1. Previous — 40px circle */}
              <button
                type="button"
                ref={prevBtnRef}
                className={`tv-apk-btn tv-apk-btn-circle ${focusedButton === 0 ? 'focused' : ''}`}
                onClick={handlePrevious}
                onMouseEnter={() => setFocusedButton(0)}
                tabIndex={controlsVisible ? 0 : -1}
                aria-label="Previous Transformation"
                title="Previous (Remote Left)"
              >
                <SkipBack size={17} strokeWidth={2.4} />
              </button>

              {/* 2. Play/Pause — 46px circle (default focus) */}
              <button
                type="button"
                ref={playBtnRef}
                className={`tv-apk-btn tv-apk-btn-play ${focusedButton === 1 ? 'focused' : ''}`}
                onClick={handleTogglePlayPause}
                onMouseEnter={() => setFocusedButton(1)}
                tabIndex={controlsVisible ? 0 : -1}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={isPlaying ? 'Pause (Remote OK)' : 'Play (Remote OK)'}
              >
                {isPlaying ? (
                  <Pause size={20} strokeWidth={2.4} />
                ) : (
                  <Play size={20} strokeWidth={2.4} style={{ marginLeft: '2px' }} />
                )}
              </button>

              {/* 3. Next — 40px circle */}
              <button
                type="button"
                ref={nextBtnRef}
                className={`tv-apk-btn tv-apk-btn-circle ${focusedButton === 2 ? 'focused' : ''}`}
                onClick={handleNext}
                onMouseEnter={() => setFocusedButton(2)}
                tabIndex={controlsVisible ? 0 : -1}
                aria-label="Next Transformation"
                title="Next (Remote Right)"
              >
                <SkipForward size={17} strokeWidth={2.4} />
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
               RIGHT PANEL (20%) — Instagram QR & Salon Contact Info
               Hidden when in Fullscreen Mode (Horizontal Video or Before & After)
             ══════════════════════════════════════════════════════ */}
          {!isFullScreen && (
            <div className="tv-apk-panel tv-apk-right-panel">
              {/* Instagram Header & Handle */}
              <div className="tv-apk-insta-section">
                <div className="tv-apk-insta-icon">📸</div>
                <div className="tv-apk-qr-kicker">OFFICIAL INSTAGRAM</div>
                <div className="tv-apk-insta-handle">@wakale_dipali_</div>
                <div className="tv-apk-insta-sub">Dipali Wakale &bull; Hair Artist</div>
              </div>

              {/* Real Scannable Instagram QR Code Card */}
              <div className="tv-apk-qr-section">
                <div className="tv-apk-qr-box">
                  <img
                    src="/brand/instagram-qr.svg"
                    alt="Scan for Dipali Wakale Instagram"
                    className="tv-apk-qr-img"
                  />
                </div>
                <div className="tv-apk-scan-sub" style={{ marginTop: '6px', color: '#F2C9B6', fontWeight: 600 }}>
                  Scan to Follow Our Transformations
                </div>
              </div>

              <div className="tv-apk-divider-subtle" />

              {/* Salon Contact Details */}
              <div className="tv-apk-contact-section">
                <div className="tv-apk-contact-title">CONTACT &amp; CLINIC</div>
                <div className="tv-apk-contact-row">
                  <span className="tv-apk-contact-icon">📞</span>
                  <span className="tv-apk-contact-text">+91 8805291910</span>
                </div>
                <div className="tv-apk-contact-row">
                  <span className="tv-apk-contact-icon">📞</span>
                  <span className="tv-apk-contact-text">+91 8237108495</span>
                </div>
                <div className="tv-apk-contact-row">
                  <span className="tv-apk-contact-icon">📍</span>
                  <span className="tv-apk-contact-text">Ghargaon, Sangamner &bull; Pune</span>
                </div>
                <div className="tv-apk-contact-badge">
                  ✦ 4.9★ Rated on Google (500+ Reviews) ✦
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="tv-apk-empty">
          <div className="tv-apk-empty-icon">✂</div>
          <h2>DIPALI WAKALE CLINIC</h2>
          <p className="tv-apk-empty-sub">Connecting to Transformation Display...</p>
          <p className="tv-apk-empty-hint">Publish transformations from the Admin Dashboard to showcase on this TV.</p>
          <button
            type="button"
            className="tv-apk-nav-btn tv-apk-back-btn"
            style={{ marginTop: '22px' }}
            onClick={handleBackAction}
            aria-label="Back"
          >
            <ArrowLeft size={18} strokeWidth={2.4} />
            <span>Back to Website</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TransformationsPage;
