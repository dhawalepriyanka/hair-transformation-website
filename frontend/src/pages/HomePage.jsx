import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import BrandLogo from '../components/BrandLogo';
import Reveal from '../components/Reveal';
import { fetchProducts } from '../services/api';
import {
  Stethoscope, ArrowRight, Instagram, Sparkles, MapPin,
  HeartHandshake, Phone, Youtube, MessageCircle, Navigation, Car, Clock
} from 'lucide-react';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      const data = await fetchProducts();
      setFeaturedProducts(data.slice(0, 4));
      setLoading(false);
    };
    loadFeatured();
  }, []);

  const services = [
    { title: 'Hair Treatment Results', video: '/instagram/reels/hair-transformation.mp4' },
    { title: 'Hair Care Journey', video: '/instagram/reels/hair-extensions.mp4' },
    { title: 'Healthy Hair Guidance', video: '/instagram/reels/hair-styling.mp4' },
    { title: 'Latest Clinic Results', video: '/instagram/reels/hair-transformation.mp4' }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="section-padding home-hero">
        <div className="container">
          <div className="hero-grid">
            <Reveal className="hero-copy hero-entrance" variant="fade">
              <BrandLogo className="hero-brand-lockup" />
              <span className="hero-eyebrow">
                <Stethoscope size={16} /> Dipali Wakale – Hair Doctor &amp; Skin Care Specialist
              </span>
              
              <h1 className="serif hero-title">
                Expert Hair &amp; Scalp Care With Confidence
              </h1>
              
              <p className="hero-description">
                Professional hair and scalp consultations, hair regrowth treatments, skin care and wellness products by Dipali Wakale. Find personalized care for healthier hair and skin.
              </p>

              <div className="hero-proof">
                <span>Personal consultation</span>
                <span>Real transformations</span>
                <span>Ghargaon, Sangamner</span>
              </div>

              <div className="hero-buttons">
                <Link
                  to="/hair-styles"
                  className="hero-primary-button"
                >
                  Explore Products <ArrowRight size={18} />
                </Link>
                <Link
                  to="/transformations"
                  className="hero-secondary-button"
                >
                  View Transformations
                </Link>
              </div>
            </Reveal>

            <Reveal className="hero-visual" variant="scale" delay={140}>
              <div className="hero-image-wrapper">
                <img
                  src="/instagram/dipali-wakale-hair-doctor-hero.png"
                  alt="Dipali Wakale, hair doctor and skin care specialist"
                />
                <div className="hero-photo-label">
                  <Sparkles size={18} />
                  <span>Personalized clinical care</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Specialty Highlights */}
      <section className="section-padding" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EBE5E0' }}>
        <div className="container">
          <div className="highlights-grid">
            <Reveal className="clinic-highlight" style={{ padding: '1rem' }}>
              <Stethoscope size={32} color="#A97912" style={{ marginBottom: '0.85rem' }} />
              <h3 className="serif" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Hair &amp; Scalp Consultation</h3>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Personalized consultation and care guidance for hair fall, scalp health and regrowth concerns.</p>
            </Reveal>
            <Reveal className="clinic-highlight" style={{ padding: '1rem' }} delay={90}>
              <Sparkles size={32} color="#A97912" style={{ marginBottom: '0.85rem' }} />
              <h3 className="serif" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Hair & Skin Care Products</h3>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Trusted serums, shampoos, oils, and supplements for healthy hair growth.</p>
            </Reveal>
            <Reveal className="clinic-highlight" style={{ padding: '1rem' }} delay={180}>
              <HeartHandshake size={32} color="#A97912" style={{ marginBottom: '0.85rem' }} />
              <h3 className="serif" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Guided Product Care</h3>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Explore clinic-recommended hair care, skin care and wellness products.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="section-padding" style={{ backgroundColor: '#FAF8F6' }}>
        <div className="container">
          <Reveal style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 className="serif section-title">
              Treatment &amp; Care Highlights
            </h2>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>Explore hair-care journeys, treatment results and professional guidance</p>
          </Reveal>

          <div className="services-grid">
            {services.map((service, index) => (
              <Reveal key={service.title} className="service-reveal" delay={(index % 4) * 75}>
                <article className="instagram-service-card">
                  <div className="instagram-reel-frame">
                    <video
                      src={service.video}
                      title={service.title}
                      muted
                      loop
                      autoPlay
                      playsInline
                      controls
                      preload="metadata"
                    />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="section-padding" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container">
          {/* Section Header rearranges cleanly into a column on mobile */}
          <Reveal className="section-header">
            <div>
              <h2 className="serif section-title">
                Featured Products
              </h2>
              <p style={{ color: '#666', fontSize: '0.95rem' }}>Trusted hair regrowth, skin care & wellness products by Dipali Wakale</p>
            </div>
            <Link
              to="/hair-styles"
              style={{
                color: '#8B6410',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.95rem',
                flexShrink: 0
              }}
            >
              View All Products ({featuredProducts.length}+ Options) <ArrowRight size={16} />
            </Link>
          </Reveal>

          {loading ? (
            <SkeletonLoader count={4} />
          ) : (
            <div className="product-grid">
              {featuredProducts.map((product, index) => (
                <Reveal key={product.id} className="product-reveal" delay={(index % 4) * 70}>
                  <ProductCard product={product} mode="view" />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Dipali Wakale Section */}
      <section id="about" className="section-padding" style={{ backgroundColor: '#FAF8F6', borderTop: '1px solid #EBE5E0' }}>
        <div className="container">
          <div className="about-grid">
            <Reveal variant="left">
              <span style={{ color: '#8B6410', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>
                About Your Hair-Care Specialist
              </span>
              <h2 className="serif section-title" style={{ margin: '0.4rem 0 1.25rem 0' }}>
                Dipali Wakale – Hair Doctor
              </h2>
              <p style={{ color: '#555', lineHeight: '1.75', marginBottom: '1rem', fontSize: '0.95rem' }}>
                Dipali Wakale is a hair doctor and hair-care specialist focused on hair and scalp concerns, hair regrowth support, skin care and personalized wellness guidance.
              </p>
              <p style={{ color: '#555', lineHeight: '1.75', marginBottom: '0', fontSize: '0.95rem' }}>
                Follow her social channels for hair-care education, treatment journeys, hair regrowth results, product guidance and client experiences.
              </p>
            </Reveal>

            <Reveal className="about-photo" variant="right" delay={100} style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', height: '380px' }}>
              <img
                src="/instagram/dipali-wakale-hair-doctor-about.png"
                alt="Dipali Wakale in her professional hair and scalp clinic"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 34%' }}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Instagram, YouTube & Location Banner */}
      <section className="section-padding" style={{ backgroundColor: '#FAF8F6', borderTop: '1px solid #EBE5E0' }}>
        <Reveal className="container connect-reveal" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '0.85rem' }}>
            <Instagram size={36} color="#A97912" />
            <Youtube size={36} color="#FF0000" />
            <Phone size={36} color="#25D366" />
          </div>
          <h2 className="serif section-title">
            Connect With Dipali Wakale
          </h2>
          <p style={{ color: '#666', fontSize: '0.95rem', maxWidth: '580px', margin: '0 auto 1.25rem auto' }}>
            Follow for hair-care guidance, treatment journeys, hair regrowth results and client reviews.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', color: '#555', fontSize: '0.9rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} color="#A97912" />
              <span>Ghargaon, Sangamner – Pune Nashik Highway</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={16} color="#A97912" />
              <a href="tel:+918805291910" style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>+91 8805291910</a> / <a href="tel:+918237108495" style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>8237108495</a>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="https://instagram.com/wakale_dipali_"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#A97912',
                color: '#FFF',
                padding: '0.8rem 1.8rem',
                borderRadius: '30px',
                fontWeight: '600',
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(200, 138, 117, 0.3)',
                textDecoration: 'none'
              }}
            >
              <Instagram size={18} /> Instagram Profile
            </a>
            <a
              href="https://youtube.com/@dipali_wakale"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#FF0000',
                color: '#FFF',
                padding: '0.8rem 1.8rem',
                borderRadius: '30px',
                fontWeight: '600',
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(255, 0, 0, 0.3)',
                textDecoration: 'none'
              }}
            >
              <Youtube size={18} /> YouTube Channel
            </a>
            <a
              href="https://wa.me/918805291910?text=Hi%20Dipali%20didi,%20I%20would%20like%20to%20consult%20for%20hair%20treatment."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#25D366',
                color: '#FFF',
                padding: '0.8rem 1.8rem',
                borderRadius: '30px',
                fontWeight: '600',
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
                textDecoration: 'none'
              }}
            >
              <MessageCircle size={18} /> WhatsApp Chat
            </a>
          </div>
        </Reveal>
      </section>

    </div>
  );
};

export default HomePage;
