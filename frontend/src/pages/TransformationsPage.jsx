import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin, Clock, Star, ChevronLeft, ChevronRight,
  Play, Pause, Maximize2, Minimize2, Eye, EyeOff, Volume2, VolumeX,
  Instagram, Heart, MessageCircle, ExternalLink, Sparkles,
  SkipBack, SkipForward
} from 'lucide-react';
import { fetchTransformations, fetchSlideshowSettings } from '../services/api';
import VideoComparison from '../components/VideoComparison';
import Reveal from '../components/Reveal';

/* ─────────────── REAL INSTAGRAM SALON & CLINIC MEDIA ─────────────── */
const defaultFallbackTransformations = [];

/* ─────────────── STAR RATING ─────────────── */
const StarRating = ({ count }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={14} fill={s <= count ? '#C88A75' : 'none'} color={s <= count ? '#C88A75' : '#ccc'} />
    ))}
  </div>
);

/* ─────────────── MAIN TRANSFORMATIONS PAGE ─────────────── */
const TransformationsPage = ({ isTvMode: isTvModeProp = false }) => {
  const isTvMode = isTvModeProp || (typeof window !== 'undefined' && (
    window.location.search.includes('tv=1') ||
    window.location.pathname === '/tv' ||
    window.location.hash.includes('tv') ||
    Boolean(window.AndroidBridge)
  ));

  const [transformationsList, setTransformationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideshowSettings, setSlideshowSettings] = useState(fetchSlideshowSettings());
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(isTvMode);
  const [hideDetails, setHideDetails] = useState(isTvMode);
  const [isMuted, setIsMuted] = useState(true);
  const [userSpeedOption, setUserSpeedOption] = useState('auto'); // 'auto' | '5' | '8' | '12' | '15' | '20' | '30' | 'end'
  const [cursorVisible, setCursorVisible] = useState(true);
  const cursorTimerRef = useRef(null);
  const [tvPanelVisible, setTvPanelVisible] = useState(false);
  const [focusedButton, setFocusedButton] = useState(1); // 0: Previous, 1: Play/Pause, 2: Next

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState(8);
  const [totalSlideDuration, setTotalSlideDuration] = useState(8);

  const showcaseRef = useRef(null);
  const videoRef = useRef(null);
  const ambientVideoRef = useRef(null);
  const prevBtnRef = useRef(null);
  const playBtnRef = useRef(null);
  const nextBtnRef = useRef(null);
  const slideTimerRef = useRef(null);

  // Load transformations & slideshow settings with 30s auto-sync
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const data = await fetchTransformations();
        if (isMounted) {
          setTransformationsList(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.warn('Failed to load transformations:', e.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadData();

    // Auto-sync every 30 seconds with Admin Dashboard / Backend
    const syncInterval = setInterval(loadData, 30000);

    const handleSettingsChanged = (e) => {
      if (e.detail) {
        setSlideshowSettings(e.detail);
      }
    };
    window.addEventListener('slideshow_settings_changed', handleSettingsChanged);
    return () => {
      isMounted = false;
      clearInterval(syncInterval);
      window.removeEventListener('slideshow_settings_changed', handleSettingsChanged);
    };
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      const fsActive = document.fullscreenElement === showcaseRef.current;
      setIsFullscreen(fsActive);
      // "remove right side text if click on full screen"
      if (fsActive && slideshowSettings.hideTextInFullscreen !== false) {
        setHideDetails(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [slideshowSettings.hideTextInFullscreen]);

  const activeItem = transformationsList[activeSlide];
  const isVideo = Boolean(activeItem?.video || activeItem?.beforeVideo);

  // Calculate current duration for the active slide
  const calculateSlideDuration = useCallback(() => {
    if (!activeItem) return 8;

    // 1. If user selected a specific on-screen override
    if (userSpeedOption !== 'auto') {
      if (userSpeedOption === 'end') return 'end';
      const parsed = parseInt(userSpeedOption, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    // 2. If item has individual custom duration set by admin
    if (activeItem.duration && !isNaN(activeItem.duration) && activeItem.duration > 0) {
      return parseInt(activeItem.duration, 10);
    }

    // 3. Global admin settings
    if (isVideo) {
      if (slideshowSettings.videoDurationMode === 'end') {
        return 'end';
      }
      return parseInt(slideshowSettings.videoDuration, 10) || 15;
    }

    return parseInt(slideshowSettings.imageDuration, 10) || 8;
  }, [activeItem, isVideo, userSpeedOption, slideshowSettings]);

  // Slide navigation
  const changeSlide = useCallback((direction) => {
    if (!transformationsList.length) return;
    setActiveSlide((current) =>
      (current + direction + transformationsList.length) % transformationsList.length
    );
  }, [transformationsList.length]);

  // Handle slide countdown and auto-advance
  // Handle slide countdown and auto-advance with admin control
  useEffect(() => {
    // Clear any existing timer
    if (slideTimerRef.current) {
      clearInterval(slideTimerRef.current);
      slideTimerRef.current = null;
    }

    // Respect admin's autoSwitch setting
    if (!slideshowSettings.autoSwitch) {
      return;
    }

    if (!isPlaying || transformationsList.length < 2 || !activeItem) {
      return;
    }

    const duration = calculateSlideDuration();

    if (duration === 'end') {
      // For video awaiting end, set safety timer
      setTotalSlideDuration(30);
      setTimeLeft(30);
      slideTimerRef.current = window.setTimeout(() => {
        changeSlide(1);
      }, 75000);
      return () => clearTimeout(slideTimerRef.current);
    }

    const durationSeconds = Number(duration) || 8;
    setTotalSlideDuration(durationSeconds);
    setTimeLeft(durationSeconds);

    slideTimerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          changeSlide(1);
          return durationSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (slideTimerRef.current) {
        clearInterval(slideTimerRef.current);
        slideTimerRef.current = null;
      }
    };
  }, [activeSlide, isPlaying, transformationsList.length, calculateSlideDuration, changeSlide, activeItem, slideshowSettings.autoSwitch]);

  // Real Play/Pause toggle
  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Synchronize actual video playback with isPlaying state
  useEffect(() => {
    if (videoRef.current && isVideo) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
    if (ambientVideoRef.current && activeItem?.video) {
      if (isPlaying) {
        ambientVideoRef.current.play().catch(() => {});
      } else {
        ambientVideoRef.current.pause();
      }
    }
  }, [isPlaying, isVideo, activeItem]);

  // Ensure video playback starts smoothly on active slide change
  useEffect(() => {
    if (videoRef.current && isVideo) {
      videoRef.current.currentTime = 0;
      if (isPlaying) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
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
    if (ambientVideoRef.current && activeItem?.video) {
      ambientVideoRef.current.currentTime = 0;
      if (isPlaying) {
        ambientVideoRef.current.play().catch(() => {});
      } else {
        ambientVideoRef.current.pause();
      }
    }
  }, [activeSlide, isVideo]);

  // Handle video ended event
  const handleVideoEnded = () => {
    const duration = calculateSlideDuration();
    if (duration === 'end' && isPlaying) {
      changeSlide(1);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      showcaseRef.current?.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
      // "also i want to remove right side text if click on full screen"
      if (slideshowSettings.hideTextInFullscreen !== false) {
        setHideDetails(true);
      }
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // TV Inactivity cursor auto-hide
  useEffect(() => {
    if (!isTvMode) return;
    const handleMouseMove = () => {
      setCursorVisible(true);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = setTimeout(() => {
        setCursorVisible(false);
      }, 2500);
    };
    window.addEventListener('mousemove', handleMouseMove);
    cursorTimerRef.current = setTimeout(() => {
      setCursorVisible(false);
    }, 2500);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
    };
  }, [isTvMode]);

  // Helper functions to show and hide control panel
  const showControlPanel = useCallback(() => {
    if (!isTvMode) return;
    setTvPanelVisible(true);
    setFocusedButton(1); // Middle button receives initial focus
    try {
      window.AndroidBridge?.setPanelVisibility(true);
    } catch (e) {}
  }, [isTvMode]);

  const hideControlPanel = useCallback(() => {
    if (!isTvMode) return;
    setTvPanelVisible(false);
    try {
      window.AndroidBridge?.setPanelVisibility(false);
    } catch (e) {}
  }, [isTvMode]);

  // TV Remote navigation actions: LEFT, RIGHT, OK, BACK
  const handleTvAction = useCallback((action) => {
    if (!isTvMode) return;

    if (action === 'ok') {
      if (!tvPanelVisible) {
        // When panel is hidden: pressing OK shows all three buttons and focuses middle button
        // Do not pause the video when showing the panel!
        showControlPanel();
      } else {
        // When panel is visible: pressing OK activates the focused button
        if (focusedButton === 0) {
          // Previous button: wrap from first to last, keep panel visible
          changeSlide(-1);
        } else if (focusedButton === 1) {
          // Play/Pause button: toggle playback, keep panel visible
          togglePlayPause();
        } else if (focusedButton === 2) {
          // Next button: wrap from last to first, keep panel visible
          changeSlide(1);
        }
      }
    } else if (action === 'left') {
      if (tvPanelVisible) {
        // Move focus to previous button (clamped to 0)
        setFocusedButton((prev) => Math.max(0, prev - 1));
      }
    } else if (action === 'right') {
      if (tvPanelVisible) {
        // Move focus to next button (clamped to 2)
        setFocusedButton((prev) => Math.min(2, prev + 1));
      }
    } else if (action === 'back' || action === 'escape') {
      if (tvPanelVisible) {
        hideControlPanel();
      }
    } else if (action === 'down') {
      if (tvPanelVisible) {
        hideControlPanel();
      }
    } else if (action === 'up') {
      if (!tvPanelVisible) {
        showControlPanel();
      }
    } else if (action === 'play_pause') {
      togglePlayPause();
    }
  }, [isTvMode, tvPanelVisible, focusedButton, showControlPanel, hideControlPanel, changeSlide, togglePlayPause]);

  // Synchronize DOM focus to the active button when panel is visible
  useEffect(() => {
    if (!isTvMode || !tvPanelVisible) return;
    if (focusedButton === 0) {
      prevBtnRef.current?.focus();
    } else if (focusedButton === 1) {
      playBtnRef.current?.focus();
    } else if (focusedButton === 2) {
      nextBtnRef.current?.focus();
    }
  }, [isTvMode, tvPanelVisible, focusedButton]);

  // Expose global TV controls to Android WebView layer
  useEffect(() => {
    if (!isTvMode) return;
    window.onTvRemoteKey = (action) => {
      handleTvAction(action);
    };
    window.hideTvControlPanel = hideControlPanel;
    window.showTvControlPanel = showControlPanel;
    return () => {
      delete window.onTvRemoteKey;
      delete window.hideTvControlPanel;
      delete window.showTvControlPanel;
    };
  }, [isTvMode, handleTvAction, hideControlPanel, showControlPanel]);

  // TV Remote & Keyboard navigation event listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isTvMode) {
        // Prevent default browser scrolling on arrow keys and space
        if (e.key === 'ArrowLeft') {
          handleTvAction('left');
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          handleTvAction('right');
          e.preventDefault();
        } else if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
          handleTvAction('ok');
          e.preventDefault();
        } else if (e.key === 'Escape' || e.key === 'Back' || e.key === 'BrowserBack') {
          if (tvPanelVisible) {
            handleTvAction('back');
            e.preventDefault();
          }
        } else if (e.key === 'ArrowUp') {
          handleTvAction('up');
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          if (tvPanelVisible) {
            handleTvAction('down');
            e.preventDefault();
          }
        }
        return;
      }

      // Non-TV keyboard shortcuts (unchanged)
      if (e.key === 'ArrowLeft' || e.key === 'MediaTrackPrevious') {
        changeSlide(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'MediaTrackNext') {
        changeSlide(1);
      } else if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space' || e.key === 'MediaPlayPause') {
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      } else if (e.key === 't' || e.key === 'T' || e.key === 'ArrowDown') {
        setHideDetails((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeSlide, isTvMode, handleTvAction, tvPanelVisible]);

  const progressPercent = totalSlideDuration > 0
    ? Math.max(0, Math.min(100, ((totalSlideDuration - timeLeft) / totalSlideDuration) * 100))
    : 0;

  return (
    <div
      className={isTvMode ? `tv-kiosk-wrapper ${!cursorVisible ? 'tv-cursor-hidden' : ''}` : 'transformations-page section-padding'}
      style={isTvMode ? undefined : { paddingTop: '1.5rem', paddingBottom: '3rem' }}
    >
      <div className={isTvMode ? 'tv-kiosk-inner' : 'container'}>

        {/* ── TOP ACTION BAR (Hidden on TV) ── */}
        {!isTvMode && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h1 className="serif" style={{ fontSize: '1.8rem', margin: 0, color: '#1E1E1E' }}>
                Transformation Screen
              </h1>
              <p style={{ margin: '3px 0 0', color: '#777', fontSize: '0.88rem' }}>
                Dipali Wakale Salon & Clinic Showcase • Optimized for 55″ Displays
              </p>
            </div>
          </div>
        )}

        {/* ── 55-INCH TV AUTOMATIC SHOWCASE SCREEN ── */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '5rem', color: '#888' }}>Loading transformation screen...</p>
        ) : activeItem ? (
          <Reveal variant="scale" delay={50}>
            <div
              className={`tv-showcase ${hideDetails ? 'tv-hide-text' : ''} ${isFullscreen || isTvMode ? 'tv-55in-mode' : ''}`}
              ref={showcaseRef}
              style={{ marginBottom: isTvMode ? 0 : '1rem' }}
            >
              {/* Top Countdown Progress Line */}
              {isPlaying && !isTvMode && (
                <div className="tv-progress-line">
                  <div className="tv-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
              )}

              {/* Ambient TV Glow in Background */}
              <div className="tv-showcase-glow" />

              {/* Top Corner TV Bar */}
              {!isTvMode && (
                <div className="tv-top-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Auto-Switch Countdown Indicator */}
                    <span className="tv-timer-pill" title="Auto-advance countdown">
                      <Clock size={14} color="#F5A58D" />
                      {userSpeedOption === 'end' ? 'Full Video' : `${timeLeft}s`}
                    </span>
                  </div>

                  {/* Top Right Quick Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Switch Speed Selector for salon staff */}
                    <select
                      className="tv-speed-dropdown"
                      value={userSpeedOption}
                      onChange={(e) => setUserSpeedOption(e.target.value)}
                      aria-label="Set slide switch time"
                      title="Change automatic switch timing"
                    >
                      <option value="auto">Time: Auto (Admin Timing)</option>
                      <option value="5">5s (Quick Switch)</option>
                      <option value="8">8s (Standard Photo)</option>
                      <option value="12">12s (Medium Reel)</option>
                      <option value="15">15s (Standard Reel)</option>
                      <option value="20">20s (Extended Reel)</option>
                      <option value="30">30s (Slow Switch)</option>
                      <option value="end">Full Video End</option>
                    </select>

                    {/* Toggle Side Text Button */}
                    <button
                      type="button"
                      onClick={() => setHideDetails((prev) => !prev)}
                      className="tv-quick-btn"
                      style={{
                        background: 'rgba(20, 14, 12, 0.75)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.76rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      title={hideDetails ? 'Show client text' : 'Remove right side text for clean 55" TV screen'}
                    >
                      {hideDetails ? <Eye size={14} /> : <EyeOff size={14} />}
                      {hideDetails ? 'Show Text' : 'Hide Text'}
                    </button>

                    {/* Fullscreen Button */}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      style={{
                        background: 'rgba(200, 138, 117, 0.85)',
                        border: 'none',
                        color: '#fff',
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center'
                      }}
                      title={isFullscreen ? 'Exit Fullscreen' : 'Enter 55″ Fullscreen'}
                    >
                      {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* ── SLIDE CONTENT ── */}
              <div className="tv-slide" key={activeItem.id}>

                {/* Left/Main Media Visual (Expands to 100% when right text is hidden) */}
                <div className={`tv-visual ${isVideo ? 'tv-video-visual' : ''}`}>
                  {/* Floating Social Media Handle Watermark */}
                  {!isTvMode && (
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      zIndex: 14,
                      background: 'rgba(15, 10, 8, 0.72)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '30px',
                      padding: '4px 12px 4px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      pointerEvents: 'none'
                    }}>
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Instagram size={11} color="#FFF" />
                      </span>
                      <span>{activeItem.handle || '@wakale_dipali_'}</span>
                    </div>
                  )}

                  {/* Ambient Backdrop for Vertical Reels on 55" screen */}
                  {activeItem.video && (
                    <video
                      ref={ambientVideoRef}
                      className="tv-ambient-backdrop"
                      src={activeItem.video}
                      muted
                      autoPlay
                      loop
                      playsInline
                      aria-hidden="true"
                    />
                  )}

                  {activeItem.beforeVideo && activeItem.afterVideo ? (
                    <VideoComparison before={activeItem.beforeVideo} after={activeItem.afterVideo} clientName={activeItem.clientName} />
                  ) : activeItem.video ? (
                    <video
                      ref={videoRef}
                      className="tv-transformation-video"
                      src={activeItem.video}
                      poster={activeItem.poster || activeItem.after || activeItem.image}
                      controls={!isTvMode}
                      autoPlay
                      muted={isMuted}
                      loop={calculateSlideDuration() !== 'end'}
                      playsInline
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={handleVideoEnded}
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : activeItem.image ? (
                    <>
                      <img className="tv-ambient-backdrop" src={activeItem.image} alt="" aria-hidden="true" />
                      <img className="tv-single-image" src={activeItem.image} alt={activeItem.clientName} />
                    </>
                  ) : activeItem.before && activeItem.after ? (
                    <>
                      <img className="tv-after-image" src={activeItem.after} alt={`After - ${activeItem.clientName}`} />
                      <div className="tv-before-layer">
                        <img src={activeItem.before} alt={`Before - ${activeItem.clientName}`} />
                      </div>
                      <div className="tv-reveal-line"><span>✦</span></div>
                      <span className="tv-label tv-label-before">BEFORE</span>
                      <span className="tv-label tv-label-after">AFTER ✨</span>
                    </>
                  ) : null}

                  {/* Floating minimalist badge when right-side text is hidden (for 55" TV) */}
                  {hideDetails && !isTvMode && (
                    <div className="tv-floating-tag">
                      <span className="tag-badge">{activeItem.category}</span>
                      <span className="tag-title">{activeItem.clientName}</span>
                      <span className="tag-desc">💆 {activeItem.treatment}</span>
                    </div>
                  )}
                </div>

                {/* Right Side Text (Hidden if user clicks Fullscreen or Hide Text) */}
                {!hideDetails && (
                  <div className="tv-story">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="tv-category">{activeItem.category}</span>
                      <a
                        href="https://www.instagram.com/wakale_dipali_/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          color: '#E1306C',
                          textDecoration: 'none',
                          background: 'rgba(225, 48, 108, 0.12)',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          border: '1px solid rgba(225, 48, 108, 0.25)'
                        }}
                      >
                        <Instagram size={13} /> {activeItem.handle || '@wakale_dipali_'}
                      </a>
                    </div>

                    <p className="tv-kicker">Dipali Wakale • Hair Doctor & Salon</p>
                    <h2>{activeItem.clientName}</h2>
                    <h3>{activeItem.treatment}</h3>

                    {/* Social Media Engagement Stats */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      margin: '0.4rem 0 1rem',
                      fontSize: '0.82rem',
                      color: '#d2c8c4',
                      flexWrap: 'wrap'
                    }}>
                      {activeItem.likes && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ff7b92', fontWeight: '700' }}>
                          <Heart size={14} fill="#ff7b92" /> {activeItem.likes} Likes
                        </span>
                      )}
                      {activeItem.comments && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MessageCircle size={14} /> {activeItem.comments} Comments
                        </span>
                      )}
                      {activeItem.period && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} /> {activeItem.period}
                        </span>
                      )}
                      {activeItem.village && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} /> {activeItem.village}
                        </span>
                      )}
                    </div>

                    {activeItem.rating > 0 && <div className="tv-stars"><StarRating count={activeItem.rating} /></div>}
                    {activeItem.testimonial && <blockquote>"{activeItem.testimonial}"</blockquote>}

                    {/* Social Media Hashtags */}
                    {activeItem.hashtags && (
                      <div style={{
                        marginTop: '1rem',
                        fontSize: '0.8rem',
                        color: '#F5A58D',
                        fontWeight: '500',
                        lineHeight: 1.4
                      }}>
                        {activeItem.hashtags}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '1.2rem', flexWrap: 'wrap' }}>
                      <p className="tv-signature" style={{ margin: 0 }}>Transformation by Dipali Wakale</p>
                      <a
                        href="https://www.instagram.com/wakale_dipali_/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          color: '#FFF',
                          background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          textDecoration: 'none',
                          boxShadow: '0 2px 10px rgba(225,48,108,0.3)',
                          cursor: 'pointer'
                        }}
                      >
                        <Instagram size={13} /> View on Instagram <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* ── BOTTOM CONTROLS BAR ── */}
              {!isTvMode && (
                <div className="tv-controls">
                  <button type="button" onClick={() => changeSlide(-1)} aria-label="Previous transformation" title="Previous Slide">
                    <ChevronLeft />
                  </button>

                  <div className="tv-dots">
                    {transformationsList.map((item, index) => (
                      <button
                        type="button"
                        key={item.id}
                        className={index === activeSlide ? 'active' : ''}
                        onClick={() => setActiveSlide(index)}
                        aria-label={`Show transformation ${index + 1}`}
                        title={`${item.clientName} (${index + 1}/${transformationsList.length})`}
                      />
                    ))}
                  </div>

                  {/* Play / Pause Auto-Switch */}
                  <button
                    type="button"
                    onClick={() => setIsPlaying((playing) => !playing)}
                    aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                    title={isPlaying ? 'Pause Auto-Switch' : 'Start Auto-Switch'}
                  >
                    {isPlaying ? <Pause /> : <Play />}
                  </button>

                  {/* Audio Mute/Unmute for video reels */}
                  {isVideo && (
                    <button
                      type="button"
                      onClick={() => setIsMuted((m) => !m)}
                      aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                      title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                      {isMuted ? <VolumeX /> : <Volume2 />}
                    </button>
                  )}

                  <button type="button" onClick={() => changeSlide(1)} aria-label="Next transformation" title="Next Slide">
                    <ChevronRight />
                  </button>

                  <button type="button" onClick={toggleFullscreen} aria-label="Toggle 55″ Fullscreen" title="Toggle 55″ Fullscreen">
                    {isFullscreen ? <Minimize2 /> : <Maximize2 />}
                  </button>
                </div>
              )}

              {/* ── ANDROID TV TOGGLE CONTROL PANEL ── */}
              {isTvMode && (
                <div
                  className={`tv-toggle-control-panel ${tvPanelVisible ? 'tv-panel-visible' : ''}`}
                  role="toolbar"
                  aria-label="Android TV Playback Controls"
                >
                  {/* Previous Button */}
                  <button
                    type="button"
                    ref={prevBtnRef}
                    className={`tv-panel-btn ${focusedButton === 0 ? 'tv-panel-btn-focused' : ''}`}
                    onClick={() => {
                      changeSlide(-1);
                      setFocusedButton(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                    }}
                    tabIndex={tvPanelVisible ? 0 : -1}
                    aria-label="Previous transformation video"
                  >
                    <SkipBack size={38} strokeWidth={2.4} />
                    <span className="tv-panel-btn-label">Previous</span>
                  </button>

                  {/* Play / Pause Toggle Button */}
                  <button
                    type="button"
                    ref={playBtnRef}
                    className={`tv-panel-btn tv-panel-btn-main ${focusedButton === 1 ? 'tv-panel-btn-focused' : ''}`}
                    onClick={() => {
                      togglePlayPause();
                      setFocusedButton(1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                    }}
                    tabIndex={tvPanelVisible ? 0 : -1}
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  >
                    {isPlaying ? (
                      <Pause size={44} strokeWidth={2.4} />
                    ) : (
                      <Play size={44} strokeWidth={2.4} style={{ marginLeft: '4px' }} />
                    )}
                    <span className="tv-panel-btn-label">{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  {/* Next Button */}
                  <button
                    type="button"
                    ref={nextBtnRef}
                    className={`tv-panel-btn ${focusedButton === 2 ? 'tv-panel-btn-focused' : ''}`}
                    onClick={() => {
                      changeSlide(1);
                      setFocusedButton(2);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                    }}
                    tabIndex={tvPanelVisible ? 0 : -1}
                    aria-label="Next transformation video"
                  >
                    <SkipForward size={38} strokeWidth={2.4} />
                    <span className="tv-panel-btn-label">Next</span>
                  </button>
                </div>
              )}
            </div>
          </Reveal>
        ) : <p style={{ textAlign: 'center' }}>No transformations available.</p>}

      </div>
    </div>
  );
};

export default TransformationsPage;
