import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Instagram, Scissors, Sparkles, ArrowRight,
  MapPin, Clock, Star, User, ChevronLeft, ChevronRight,
  Play, Pause, Maximize2
} from 'lucide-react';
import { fetchTransformations } from '../services/api';


/* ─────────────── BEFORE / AFTER DATA ─────────────── */
const transformations = [
  {
    id: 1,
    clientName: 'Priya Deshmukh',
    village: 'Nashik, Maharashtra',
    treatment: 'Premium Keratin Hair Extensions',
    period: 'June 2024 · 3 hrs',
    rating: 5,
    testimonial: '"माझ्या केसांमध्ये एवढी volume येईल असं वाटलं नव्हतं! Dipali didi खूप छान करतात।"',
    before: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800&h=700',
    after:  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800&h=700',
    category: 'Hair Extensions',
  },
  {
    id: 2,
    clientName: 'Savita Kulkarni',
    village: 'Ahmednagar, Maharashtra',
    treatment: 'Butterfly Cut & Layer Styling',
    period: 'July 2024 · 2 hrs',
    rating: 5,
    testimonial: '"खूप छान काम केलं! माझ्या केसांमध्ये आता खूप volume आहे।"',
    before: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800&h=700',
    after:  'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800&h=700',
    category: 'Haircut Transformation',
  },
  {
    id: 3,
    clientName: 'Anita Shinde',
    village: 'Pune, Maharashtra',
    treatment: 'Full Volume Hair Transformation',
    period: 'August 2024 · 4 hrs',
    rating: 5,
    testimonial: '"Dipali tai ne maza look completely badlun takla! Khup khush aahe mi."',
    before: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800&h=700',
    after:  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800&h=700',
    category: 'Full Makeover',
  },
  {
    id: 4,
    clientName: 'Rekha Jadhav',
    village: 'Aurangabad, Maharashtra',
    treatment: 'Royal Bridal Hairstyle & Updo',
    period: 'September 2024 · 3.5 hrs',
    rating: 5,
    testimonial: '"माझ्या लग्नाचा दिवस perfect झाला Dipali didi मुळे! Thank you so much."',
    before: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800&h=700',
    after:  'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800&h=700',
    category: 'Bridal Styling',
  },
  {
    id: 5,
    clientName: 'Meena Patil',
    village: 'Kolhapur, Maharashtra',
    treatment: 'Balayage & Ombre Color',
    period: 'October 2024 · 5 hrs',
    rating: 5,
    testimonial: '"Color ekdum natural disto! Mala watla nahi itka sundar hoel."',
    before: 'https://images.unsplash.com/photo-1487412947147-5cebf96c66de?auto=format&fit=crop&q=80&w=800&h=700',
    after:  'https://images.unsplash.com/photo-1487412947147-5cebf96c66de?auto=format&fit=crop&q=80&w=800&h=700',
    category: 'Color Transformation',
  },
  {
    id: 6,
    clientName: 'Kavita Bhosale',
    village: 'Solapur, Maharashtra',
    treatment: 'Chic Bob & Short Haircut',
    period: 'November 2024 · 1.5 hrs',
    rating: 5,
    testimonial: '"मला खूप धाडस वाटत होतं short cut साठी, पण result पाहून मी खूश झाले!"',
    before: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=800&h=700',
    after:  'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=800&h=700',
    category: 'Haircut Makeover',
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

/* ─────────────── BEFORE/AFTER DRAG SLIDER CARD ─────────────── */
const BeforeAfterCard = ({ item }) => {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0-100
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const updateSlider = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    setSliderPos((x / rect.width) * 100);
  }, []);

  /* Mouse events */
  const onMouseDown = (e) => { e.preventDefault(); isDragging.current = true; };
  const onMouseMove = useCallback((e) => { if (isDragging.current) updateSlider(e.clientX); }, [updateSlider]);
  const onMouseUp   = useCallback(() => { isDragging.current = false; }, []);

  /* Touch events */
  const onTouchStart = () => { isDragging.current = true; };
  const onTouchMove  = useCallback((e) => { if (isDragging.current) updateSlider(e.touches[0].clientX); }, [updateSlider]);
  const onTouchEnd   = useCallback(() => { isDragging.current = false; }, []);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid #EBE5E0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(200,138,117,0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
        isDragging.current = false;
      }}
    >
      {/* ── VERTICAL SPLIT SLIDER ── */}
      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'relative',
          height: '300px',
          overflow: 'hidden',
          cursor: 'col-resize',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* AFTER image — vibrant, bright, fully treated look */}
        <img
          src={item.after}
          alt={`After - ${item.clientName}`}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            filter: 'saturate(1.35) brightness(1.08) contrast(1.05)',
          }}
          draggable={false}
        />

        {/* BEFORE image — desaturated + dimmed to simulate untreated hair */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${sliderPos}%`,
            overflow: 'hidden',
          }}
        >
          <img
            src={item.before}
            alt={`Before - ${item.clientName}`}
            style={{
              position: 'absolute', inset: 0,
              width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
              height: '100%', objectFit: 'cover', maxWidth: 'none',
              filter: 'grayscale(75%) brightness(0.75) contrast(0.95) sepia(15%)',
            }}
            draggable={false}
          />
          {/* Subtle dark overlay on before side */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0))',
            pointerEvents: 'none',
          }} />
        </div>

        {/* BEFORE label */}
        <div style={{
          position: 'absolute', top: '12px', left: '10px', zIndex: 4,
          background: 'rgba(30,30,30,0.72)', color: '#fff',
          padding: '4px 10px', borderRadius: '20px',
          fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px',
          pointerEvents: 'none',
        }}>
          BEFORE
        </div>

        {/* AFTER label */}
        <div style={{
          position: 'absolute', top: '12px', right: '10px', zIndex: 4,
          background: '#C88A75', color: '#fff',
          padding: '4px 10px', borderRadius: '20px',
          fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px',
          pointerEvents: 'none',
        }}>
          AFTER ✨
        </div>

        {/* Category badge */}
        <div style={{
          position: 'absolute', bottom: '12px', left: '10px', zIndex: 4,
          background: '#F7EFEA', color: '#C88A75',
          padding: '4px 10px', borderRadius: '20px',
          fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.5px',
          pointerEvents: 'none',
        }}>
          {item.category}
        </div>

        {/* Vertical divider line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${sliderPos}%`,
            transform: 'translateX(-50%)',
            width: '3px',
            background: '#fff',
            zIndex: 5,
            boxShadow: '0 0 8px rgba(0,0,0,0.35)',
            pointerEvents: 'none',
          }}
        />

        {/* Drag handle circle */}
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${sliderPos}%`,
            transform: 'translate(-50%, -50%)',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            zIndex: 6,
            cursor: 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2.5px solid #C88A75',
          }}
        >
          {/* Left-right arrows */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M8 12H16M8 12L11 9M8 12L11 15M16 12L13 9M16 12L13 15" stroke="#C88A75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── CLIENT DETAILS ── */}
      <div style={{ padding: '1.25rem 1.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <User size={15} color="#C88A75" />
            <span style={{ fontWeight: '700', fontSize: '1rem', color: '#1E1E1E' }}>{item.clientName}</span>
          </div>
          <StarRating count={item.rating} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
          <MapPin size={13} color="#888" />
          <span style={{ fontSize: '0.8rem', color: '#666' }}>{item.village}</span>
        </div>
        <div style={{ marginBottom: '0.35rem' }}>
          <span style={{
            display: 'inline-block', background: '#F7EFEA', color: '#C88A75',
            padding: '3px 10px', borderRadius: '20px', fontSize: '0.73rem', fontWeight: '600',
          }}>
            💆 {item.treatment}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
          <Clock size={13} color="#888" />
          <span style={{ fontSize: '0.78rem', color: '#666' }}>{item.period}</span>
        </div>
        <p style={{
          fontSize: '0.82rem', color: '#555', fontStyle: 'italic', lineHeight: '1.55',
          borderLeft: '3px solid #F0D5C8', paddingLeft: '10px', margin: 0,
        }}>
          {item.testimonial}
        </p>
      </div>
    </div>
  );
};


/* ─────────────── PRODUCT CARD ─────────────── */
const ProductItem = ({ product }) => (
  <div
    style={{
      backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #EBE5E0',
      padding: '1.2rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = '0 6px 22px rgba(200,138,117,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)';
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '1.6rem' }}>{product.icon}</span>
      <span style={{
        fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
        letterSpacing: '0.5px', color: '#C88A75', background: '#F7EFEA',
        padding: '3px 9px', borderRadius: '20px',
      }}>
        {product.category}
      </span>
    </div>
    <h3 style={{
      fontFamily: 'var(--font-sans)', fontSize: '0.92rem', fontWeight: '700',
      color: '#1E1E1E', lineHeight: '1.35', margin: 0,
    }}>
      {product.name}
    </h3>
    <p style={{ fontSize: '0.7rem', color: '#aaa', margin: 0 }}>Code: {product.barcode}</p>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem' }}>
      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#C88A75' }}>
        ₹{product.mrp.toLocaleString('en-IN', { minimumFractionDigits: product.mrp % 1 !== 0 ? 2 : 0 })}
      </span>
      <a
        href={`https://wa.me/919999999999?text=Hi%20Dipali%20didi%2C%20I%20want%20to%20order%20${encodeURIComponent(product.name)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          backgroundColor: '#25D366', color: '#fff', padding: '6px 14px',
          borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
          display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none',
        }}
      >
        <Phone size={12} /> Order
      </a>
    </div>
  </div>
);

/* ─────────────── MAIN PAGE ─────────────── */
const TransformationsPage = () => {
  const [transformationsList, setTransformationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const showcaseRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTransformations();
        setTransformationsList(data);
      } catch (e) {
        setTransformationsList(transformations);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isPlaying || transformationsList.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % transformationsList.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [isPlaying, transformationsList.length]);

  useEffect(() => {
    if (activeSlide >= transformationsList.length && transformationsList.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, transformationsList.length]);

  const changeSlide = (direction) => {
    if (!transformationsList.length) return;
    setActiveSlide((current) =>
      (current + direction + transformationsList.length) % transformationsList.length
    );
  };

  const openFullscreen = () => {
    showcaseRef.current?.requestFullscreen?.();
  };

  const activeItem = transformationsList[activeSlide];

  return (
    <div className="transformations-page section-padding">
      <div className="container">

        {/* ── PAGE HEADER ── */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#F7EFEA', color: '#C88A75', padding: '6px 16px',
            borderRadius: '30px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem',
          }}>
            <Sparkles size={16} /> Dipali Wakale Transformations Gallery
          </span>
          <h1 className="serif section-title">Real Hair Transformations</h1>
          <p style={{ color: '#666', fontSize: '1rem', maxWidth: '650px', margin: '0.75rem auto 0' }}>
            Sit back and watch real client transformations come to life in our automatic Before & After showcase.
          </p>
        </div>

        {/* ── TV-FRIENDLY AUTOMATIC SHOWCASE ── */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading transformations...</p>
        ) : activeItem ? (
          <div className="tv-showcase" ref={showcaseRef} style={{ marginBottom: '4rem' }}>
            <div className="tv-showcase-glow" />
            <div className="tv-slide" key={activeItem.id}>
              <div className="tv-visual">
                <img className="tv-after-image" src={activeItem.after} alt={`After - ${activeItem.clientName}`} />
                <div className="tv-before-layer">
                  <img src={activeItem.before} alt={`Before - ${activeItem.clientName}`} />
                </div>
                <div className="tv-reveal-line"><span>✦</span></div>
                <span className="tv-label tv-label-before">BEFORE</span>
                <span className="tv-label tv-label-after">AFTER ✨</span>
              </div>

              <div className="tv-story">
                <span className="tv-category">{activeItem.category}</span>
                <p className="tv-kicker">A beautiful new chapter</p>
                <h2>{activeItem.clientName}</h2>
                <h3>{activeItem.treatment}</h3>
                <div className="tv-meta">
                  <span><MapPin size={18} /> {activeItem.village}</span>
                  <span><Clock size={18} /> {activeItem.period}</span>
                </div>
                <div className="tv-stars"><StarRating count={activeItem.rating} /></div>
                <blockquote>{activeItem.testimonial}</blockquote>
                <p className="tv-signature">Transformation by Dipali Wakale</p>
              </div>
            </div>

            <div className="tv-controls">
              <button type="button" onClick={() => changeSlide(-1)} aria-label="Previous transformation"><ChevronLeft /></button>
              <div className="tv-dots">
                {transformationsList.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    className={index === activeSlide ? 'active' : ''}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Show transformation ${index + 1}`}
                  />
                ))}
              </div>
              <button type="button" onClick={() => setIsPlaying((playing) => !playing)} aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}>
                {isPlaying ? <Pause /> : <Play />}
              </button>
              <button type="button" onClick={() => changeSlide(1)} aria-label="Next transformation"><ChevronRight /></button>
              <button type="button" onClick={openFullscreen} aria-label="Open fullscreen"><Maximize2 /></button>
            </div>
          </div>
        ) : <p style={{ textAlign: 'center' }}>No transformations available.</p>}



        {/* ── CTA SECTION (original) ── */}
        <div style={{
          backgroundColor: '#FAF8F6', borderRadius: '20px', padding: '2.5rem 1.5rem',
          textAlign: 'center', border: '1px solid #EBE5E0',
        }}>
          <Scissors size={32} color="#C88A75" style={{ marginBottom: '0.85rem' }} />
          <h2 className="serif section-title" style={{ marginBottom: '0.5rem' }}>
            Want Your Own Hair Transformation?
          </h2>
          <p style={{ color: '#666', marginBottom: '1.75rem', maxWidth: '520px', margin: '0 auto 1.75rem auto', fontSize: '0.95rem' }}>
            Browse our full catalogue of hair styles, select your favorites, and print a custom style sheet for your consultation.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/hair-styles"
              style={{
                backgroundColor: '#C88A75', color: '#FFF', padding: '0.8rem 1.8rem',
                borderRadius: '30px', fontWeight: '600', fontSize: '0.95rem',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}
            >
              Browse Hair Styles Catalogue <ArrowRight size={18} />
            </Link>
            <a
              href="https://instagram.com/wakale_dipali_"
              target="_blank" rel="noopener noreferrer"
              className="btn-social btn-instagram"
              style={{ padding: '0.8rem 1.6rem' }}
            >
              <Instagram size={18} /> Watch Transformation Reels on Instagram
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TransformationsPage;
