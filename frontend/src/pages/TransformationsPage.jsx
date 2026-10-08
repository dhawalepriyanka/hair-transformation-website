import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin, Clock, Star, ChevronLeft, ChevronRight,
  Play, Pause, Maximize2, Minimize2, Eye, EyeOff, Volume2, VolumeX,
  Tv, Instagram, Heart, MessageCircle, ExternalLink, Sparkles
} from 'lucide-react';
import { fetchTransformations, fetchSlideshowSettings } from '../services/api';
import VideoComparison from '../components/VideoComparison';
import Reveal from '../components/Reveal';

/* ─────────────── REAL INSTAGRAM SALON & CLINIC MEDIA ─────────────── */
const defaultFallbackTransformations = [
  {
    id: 9100001,
    clientName: 'Hair Transformation Reel',
    treatment: 'Keratin Smoothening & Gloss Shine',
    village: 'Sangamner, Maharashtra',
    period: 'Instagram Reel • 48K Views',
    video: '/instagram/reels/hair-transformation.mp4',
    category: 'Hair Transformation',
    rating: 5,
    likes: '2.8K',
    comments: '94',
    handle: '@wakale_dipali_',
    testimonial: 'केसांचा पोत एकदम मऊ आणि शायनी झाला. Dipali didi यांचे काम अप्रतिम आहे!',
    hashtags: '#dipaliwakale #hairtransformation #botoxhair #sangamner #salonlife',
    duration: 15,
  },
  {
    id: 9100002,
    clientName: 'Hair Extensions Reel',
    treatment: 'Seamless Length & Volume Blend',
    village: 'Nashik, Maharashtra',
    period: 'Instagram Reel • 36K Views',
    video: '/instagram/reels/hair-extensions.mp4',
    category: 'Hair Extensions',
    rating: 5,
    likes: '2.1K',
    comments: '78',
    handle: '@wakale_dipali_',
    testimonial: 'Instant length and natural thickness with seamless blending. Truly amazed!',
    hashtags: '#hairextensions #naturalvolume #hairgoals #dipaliwakale #nashik',
    duration: 15,
  },
  {
    id: 9100003,
    clientName: 'Hair Styling Reel',
    treatment: 'Professional Salon Blowdry & Curls',
    village: 'Ghargaon, Sangamner',
    period: 'Instagram Reel • 29K Views',
    video: '/instagram/reels/hair-styling.mp4',
    category: 'Hair Styling',
    rating: 5,
    likes: '1.9K',
    comments: '62',
    handle: '@wakale_dipali_',
    testimonial: 'Bouncy curls and salon finish that lasted through the entire family occasion.',
    hashtags: '#blowout #saloncurls #hairstyling #dipaliwakalestudio',
    duration: 15,
  },
  {
    id: 9100004,
    clientName: 'Pooja Kadam',
    treatment: 'Full Volume Hair Extensions Makeover',
    village: 'Akole',
    period: 'Instagram Post • 1.4K Likes',
    before: '/instagram/long-hair-styling.jpg',
    after: '/instagram/hair-transformation-client.jpg',
    category: 'Hair Extensions',
    rating: 5,
    likes: '1.4K',
    comments: '43',
    handle: '@wakale_dipali_',
    testimonial: 'खूप सुंदर transformation! केसांची लांबी आणि घनता दोन्ही मनसोक्त वाढले.',
    hashtags: '#beforeandafter #transformation #hairextensions #haircare',
    duration: 10,
  },
  {
    id: 9100005,
    clientName: 'Dr. Dipali Wakale Clinic Consultation',
    treatment: 'Trichological Scalp Root & Follicle Analysis',
    village: 'Ghargaon Clinic',
    period: 'Clinic Session • Social Spotlight',
    image: '/instagram/dipali-wakale-hair-doctor-hero.png',
    category: 'Hair Regrowth',
    rating: 5,
    likes: '3.4K',
    comments: '112',
    handle: '@wakale_dipali_',
    testimonial: 'Comprehensive root analysis with personalized medicated lotion and shampoo regimen for hair fall reversal.',
    hashtags: '#hairdoctor #trichology #scalpanalysis #hairfallcontrol #dipaliwakale',
    duration: 10,
  },
  {
    id: 9100006,
    clientName: 'French Balayage & Caramel Melt',
    treatment: 'Custom Dimensional Hair Color & Gloss',
    village: 'Pune, Maharashtra',
    period: 'Instagram Post • 2.6K Likes',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1200&q=80',
    category: 'Hair Color',
    rating: 5,
    likes: '2.6K',
    comments: '88',
    handle: '@wakale_dipali_',
    testimonial: 'Natural sun-kissed blending without brassiness. Hair feels super healthy and soft!',
    hashtags: '#balayage #caramelhighlights #haircolor #glossyhair #trendinghair',
    duration: 9,
  },
  {
    id: 9100007,
    clientName: 'Meera Deshmukh',
    treatment: 'Nanoplastia Gold Mirror Shine Treatment',
    village: 'Sangamner',
    period: 'Instagram Post • 1.8K Likes',
    image: '/instagram/hair-transformation-client.jpg',
    category: 'Hair Transformation',
    rating: 5,
    likes: '1.8K',
    comments: '56',
    handle: '@wakale_dipali_',
    testimonial: 'Nanoplastia treatment gave zero frizz and mirror-like gloss that lasts for months!',
    hashtags: '#nanoplastia #straighthair #hairbotox #frizfreehair',
    duration: 8,
  },
  {
    id: 9100008,
    clientName: 'Russian Manicure & Nail Art',
    treatment: 'Precision Cuticle Care & Gel Extension Art',
    village: 'Sangamner Studio',
    period: 'Instagram Story & Post • 1.2K Likes',
    image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1200&q=80',
    category: 'Nail Art',
    rating: 5,
    likes: '1.2K',
    comments: '39',
    handle: '@wakale_dipali_',
    testimonial: 'Flawless clean cuticle finish with durable nail extensions and bridal chrome shine.',
    hashtags: '#russianmanicure #nailart #gelnails #bridalnails #dipaliwakale',
    duration: 8,
  },
  {
    id: 9100009,
    clientName: 'Rutuja Jagtap',
    treatment: 'Textured Blowout & Glass Hair Finish',
    village: 'Pune',
    period: 'Instagram Post • 1.5K Likes',
    image: '/instagram/long-hair-styling.jpg',
    category: 'Hair Styling',
    rating: 5,
    likes: '1.5K',
    comments: '47',
    handle: '@wakale_dipali_',
    testimonial: 'Love the bouncy waves and shine! Dipali didi takes time to explain aftercare.',
    hashtags: '#texturedblowout #glasshair #salonfinish #dipaliwakale',
    duration: 8,
  },
  {
    id: 9100010,
    clientName: 'HydraFacial & Glass Skin Glow',
    treatment: '7-Step Hydra Extraction & Serum Infusion',
    village: 'Sangamner Clinic',
    period: 'Instagram Reel • 32K Views',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
    category: 'Skin Care',
    rating: 5,
    likes: '2.3K',
    comments: '71',
    handle: '@wakale_dipali_',
    testimonial: 'Instant deep pore cleaning, intense hydration and spotless glowing skin!',
    hashtags: '#hydrafacial #skinglow #glassskin #facialtreatment #dipaliwakale',
    duration: 9,
  },
  {
    id: 9100011,
    clientName: 'Kavita Thorat',
    treatment: 'Frizz-Control Keratin Therapy',
    village: 'Sangamner',
    period: 'Instagram Post • 1.6K Likes',
    image: '/instagram/salon-client.jpg',
    category: 'Hair Transformation',
    rating: 5,
    likes: '1.6K',
    comments: '51',
    handle: '@wakale_dipali_',
    testimonial: 'Dipali Wakale salon is my go-to place for all hair and skin treatments.',
    hashtags: '#keratintreatment #frizzfree #silkyhair #sangamner',
    duration: 8,
  },
  {
    id: 9100012,
    clientName: 'Dipali Wakale Scalp Care Clinic',
    treatment: 'Custom Scalp Rejuvenation & Density Support',
    village: 'Ghargaon',
    period: 'Clinic Care • Verified Results',
    image: '/instagram/dipali-wakale-hair-doctor-about.png',
    category: 'Hair Regrowth',
    rating: 5,
    likes: '3.1K',
    comments: '98',
    handle: '@wakale_dipali_',
    testimonial: 'Targeted hair regrowth protocol supporting active follicles and healthy hair growth cycle.',
    hashtags: '#hairregrowth #hairlossreversal #trichologist #hairclinic',
    duration: 10,
  },
  {
    id: 9100013,
    clientName: 'Bridal Hair Artistry by Dipali',
    treatment: 'Signature Bridal Hair Makeover & Floral Accessories',
    village: 'Maharashtra',
    period: 'Instagram Spotlight • 4.2K Likes',
    image: '/instagram/dipali-wakale-professional-hero.png',
    category: 'Bridal Styling',
    rating: 5,
    likes: '4.2K',
    comments: '135',
    handle: '@wakale_dipali_',
    testimonial: 'Grand bridal styling with durable hold, traditional touch and glamorous finish.',
    hashtags: '#bridalhair #marathibride #weddinglook #hairstylist #dipaliwakale',
    duration: 8,
  },
  {
    id: 9100014,
    clientName: 'Pre-Bridal Skin & Hair Glow Protocol',
    treatment: 'Complete Pre-Wedding Beauty & Scalp Makeover',
    village: 'Sangamner',
    period: 'Instagram Feature • 2.7K Likes',
    image: '/instagram/dipali-wakale-about-professional-v2.png',
    category: 'Full Makeover',
    rating: 5,
    likes: '2.7K',
    comments: '82',
    handle: '@wakale_dipali_',
    testimonial: 'Customized 3-session program for radiant bridal skin and glossy, bouncy hair.',
    hashtags: '#prebridal #bridalmakeover #weddingglow #skincareroutine',
    duration: 9,
  },
  {
    id: 9100015,
    clientName: 'Anti-Dandruff Scalp Detox & High-Frequency',
    treatment: 'Deep Scalp Clarifying & Ozone Therapy',
    village: 'Ghargaon Clinic',
    period: 'Instagram Post • 1.9K Likes',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    category: 'Hair Care',
    rating: 5,
    likes: '1.9K',
    comments: '64',
    handle: '@wakale_dipali_',
    testimonial: 'Cleared stubborn dandruff flakes and soothed itchy scalp in just two sessions.',
    hashtags: '#antidandruff #scalpdetox #hairhealth #trichologycare',
    duration: 8,
  },
  {
    id: 9100016,
    clientName: 'Dipali Wakale Trichology Masterclass',
    treatment: 'Advanced Hair & Scalp Professional Training',
    village: 'Sangamner & Pune',
    period: 'Instagram Reel • 52K Views',
    image: '/instagram/dipali-wakale-about-professional-v3.png',
    category: 'Hair Doctor',
    rating: 5,
    likes: '3.9K',
    comments: '124',
    handle: '@wakale_dipali_',
    testimonial: 'Empowering salon stylists and hair professionals with scientific trichology knowledge.',
    hashtags: '#masterclass #hairacademy #hairdoctor #professionalhaircare',
    duration: 9,
  },
  {
    id: 9100017,
    clientName: 'Dipali Wakale - Hair Doctor',
    treatment: 'Certified Hair Specialist & Trichology Care',
    village: 'Ghargaon, Sangamner',
    period: 'Instagram Bio @wakale_dipali_',
    image: '/instagram/dipali-wakale-portrait.jpg',
    category: 'Full Makeover',
    rating: 5,
    likes: '5.1K',
    comments: '180',
    handle: '@wakale_dipali_',
    testimonial: 'Dedicated to helping clients regain confidence with thick, healthy, nourished hair.',
    hashtags: '#hairdoctor #dipaliwakale #sangamner #nashik #pune',
    duration: 8,
  },
  {
    id: 9100018,
    clientName: 'Micro-Ring Hair Extensions Density',
    treatment: '100% Remy Human Hair Extensions Integration',
    village: 'Nashik',
    period: 'Instagram Post • 2.2K Likes',
    image: '/instagram/dipali-wakale-professional-hero-v2.png',
    category: 'Hair Extensions',
    rating: 5,
    likes: '2.2K',
    comments: '75',
    handle: '@wakale_dipali_',
    testimonial: 'Zero heat, zero glue application with seamless blend and natural hair movement.',
    hashtags: '#microrings #humanhair #extensionsspecialist #dipaliwakale',
    duration: 8,
  },
];

/* ─────────────── STAR RATING ─────────────── */
const StarRating = ({ count }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={14} fill={s <= count ? '#C88A75' : 'none'} color={s <= count ? '#C88A75' : '#ccc'} />
    ))}
  </div>
);

/* ─────────────── MAIN TRANSFORMATIONS PAGE ─────────────── */
const TransformationsPage = () => {
  const [transformationsList, setTransformationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideshowSettings, setSlideshowSettings] = useState(fetchSlideshowSettings());
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hideDetails, setHideDetails] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [userSpeedOption, setUserSpeedOption] = useState('auto'); // 'auto' | '5' | '8' | '12' | '15' | '20' | '30' | 'end'

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState(8);
  const [totalSlideDuration, setTotalSlideDuration] = useState(8);

  const showcaseRef = useRef(null);
  const videoRef = useRef(null);
  const slideTimerRef = useRef(null);

  // Load transformations & slideshow settings
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTransformations();
        setTransformationsList(data && data.length > 0 ? data : defaultFallbackTransformations);
      } catch (e) {
        setTransformationsList(defaultFallbackTransformations);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    const handleSettingsChanged = (e) => {
      if (e.detail) {
        setSlideshowSettings(e.detail);
      }
    };
    window.addEventListener('slideshow_settings_changed', handleSettingsChanged);
    return () => window.removeEventListener('slideshow_settings_changed', handleSettingsChanged);
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
  useEffect(() => {
    if (slideTimerRef.current) {
      clearInterval(slideTimerRef.current);
      slideTimerRef.current = null;
    }

    if (!isPlaying || transformationsList.length < 2 || !activeItem) {
      return;
    }

    const duration = calculateSlideDuration();

    if (duration === 'end') {
      // Waiting for video ended event; provide a safety timer of 75 seconds
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
  }, [activeSlide, isPlaying, transformationsList.length, calculateSlideDuration, changeSlide, activeItem]);

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

  const progressPercent = totalSlideDuration > 0
    ? Math.max(0, Math.min(100, ((totalSlideDuration - timeLeft) / totalSlideDuration) * 100))
    : 0;

  return (
    <div className="transformations-page section-padding" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      <div className="container">

        {/* ── TOP ACTION BAR ── */}
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

        {/* ── 55-INCH TV AUTOMATIC SHOWCASE SCREEN ── */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '5rem', color: '#888' }}>Loading transformation screen...</p>
        ) : activeItem ? (
          <Reveal variant="scale" delay={50}>
            <div
              className={`tv-showcase ${hideDetails ? 'tv-hide-text' : ''} ${isFullscreen ? 'tv-55in-mode' : ''}`}
              ref={showcaseRef}
              style={{ marginBottom: '1rem' }}
            >
              {/* Top Countdown Progress Line */}
              {isPlaying && (
                <div className="tv-progress-line">
                  <div className="tv-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
              )}

              {/* Ambient TV Glow in Background */}
              <div className="tv-showcase-glow" />

              {/* Top Corner TV Bar */}
              <div className="tv-top-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="tv-badge-55in">
                    <Tv size={15} /> 55″ TV SHOWCASE
                  </span>

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

              {/* ── SLIDE CONTENT ── */}
              <div className="tv-slide" key={activeItem.id}>

                {/* Left/Main Media Visual (Expands to 100% when right text is hidden) */}
                <div className={`tv-visual ${isVideo ? 'tv-video-visual' : ''}`}>
                  {/* Floating Social Media Handle Watermark */}
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

                  {/* Ambient Backdrop for Vertical Reels on 55" screen */}
                  {activeItem.video && (
                    <video
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
                      poster={activeItem.after || activeItem.image}
                      controls
                      autoPlay
                      muted={isMuted}
                      loop={calculateSlideDuration() !== 'end'}
                      playsInline
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
                  {hideDetails && (
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
            </div>
          </Reveal>
        ) : <p style={{ textAlign: 'center' }}>No transformations available.</p>}

      </div>
    </div>
  );
};

export default TransformationsPage;
