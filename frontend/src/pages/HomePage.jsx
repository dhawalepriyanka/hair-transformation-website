import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { fetchProducts } from '../services/api';
import {
  Scissors, ArrowRight, Instagram, Sparkles, MapPin,
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
    { title: 'Hair Transformation', img: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=400', desc: 'Complete hair makeover texturizing & styling' },
    { title: 'Hair Extensions', img: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=400', desc: 'Premium natural human hair length & volume' },
    { title: 'Haircuts', img: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400', desc: 'Modern layered cuts, butterfly & curtain bangs' },
    { title: 'Hair Styling', img: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&q=80&w=400', desc: 'Sleek straightening, glam curls & updo braids' }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1E1E1E 0%, #2D2522 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="section-padding"
      >
        <div className="container">
          <div className="hero-grid">
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(200, 138, 117, 0.18)',
                  color: '#E0B69F',
                  padding: '6px 16px',
                  borderRadius: '30px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(200, 138, 117, 0.3)'
                }}
              >
                <Scissors size={16} /> Dipali Wakale – Hair Artist & Reel Creator
              </span>
              
              <h1 className="serif hero-title">
                Transform Your Look With Confidence
              </h1>
              
              <p style={{ fontSize: '1rem', color: '#CCC', marginBottom: '1.75rem', lineHeight: '1.7' }}>
                Professional Hair Transformations, Hair Regrowth Treatments, Skin Care & Wellness products by Dipali Wakale. Browse our products and select items for your printable consultation sheet.
              </p>

              <div className="hero-buttons">
                <Link
                  to="/hair-styles"
                  style={{
                    backgroundColor: '#C88A75',
                    color: '#FFF',
                    padding: '0.85rem 1.8rem',
                    borderRadius: '30px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(200, 138, 117, 0.4)'
                  }}
                >
                  Explore Products <ArrowRight size={18} />
                </Link>
                <Link
                  to="/transformations"
                  style={{
                    border: '1px solid #C88A75',
                    color: '#E0B69F',
                    padding: '0.85rem 1.6rem',
                    borderRadius: '30px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  View Transformations
                </Link>
              </div>
            </div>

            <div>
              <div className="hero-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800"
                  alt="Dipali Wakale Hair Artist"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialty Highlights */}
      <section className="section-padding" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EBE5E0' }}>
        <div className="container">
          <div className="highlights-grid">
            <div style={{ padding: '1rem' }}>
              <Scissors size={32} color="#C88A75" style={{ marginBottom: '0.85rem' }} />
              <h3 className="serif" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Bespoke Transformations</h3>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Custom haircut layers, volume makeovers, and personalized style consultations.</p>
            </div>
            <div style={{ padding: '1rem' }}>
              <Sparkles size={32} color="#C88A75" style={{ marginBottom: '0.85rem' }} />
              <h3 className="serif" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Hair & Skin Care Products</h3>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Trusted serums, shampoos, oils, and supplements for healthy hair growth.</p>
            </div>
            <div style={{ padding: '1rem' }}>
              <HeartHandshake size={32} color="#C88A75" style={{ marginBottom: '0.85rem' }} />
              <h3 className="serif" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Printable Product Catalogue</h3>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Select multiple products online and generate a clean A4 sheet instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="section-padding" style={{ backgroundColor: '#FAF8F6' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 className="serif section-title">
              Our Hair Services
            </h2>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>Discover specialized hair styling, extensions, and cut transformations</p>
          </div>

          <div className="services-grid">
            {services.map((service) => (
              <Link
                key={service.title}
                to="/transformations"
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                  height: '250px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  display: 'block',
                  textDecoration: 'none'
                }}
              >
                <img
                  src={service.img}
                  alt={service.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '1.25rem'
                  }}
                >
                  <h3 className="serif" style={{ color: '#FFF', fontSize: '1.3rem', marginBottom: '0.2rem' }}>
                    {service.title}
                  </h3>
                  <p style={{ color: '#DDD', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{service.desc}</p>
                  <span style={{ color: '#E0B69F', fontSize: '0.78rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    See Transformations <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="section-padding" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container">
          {/* Section Header rearranges cleanly into a column on mobile */}
          <div className="section-header">
            <div>
              <h2 className="serif section-title">
                Featured Products
              </h2>
              <p style={{ color: '#666', fontSize: '0.95rem' }}>Trusted hair regrowth, skin care & wellness products by Dipali Wakale</p>
            </div>
            <Link
              to="/hair-styles"
              style={{
                color: '#C88A75',
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
          </div>

          {loading ? (
            <SkeletonLoader count={4} />
          ) : (
            <div className="product-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} mode="view" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Dipali Wakale Section */}
      <section id="about" className="section-padding" style={{ backgroundColor: '#FAF8F6', borderTop: '1px solid #EBE5E0' }}>
        <div className="container">
          <div className="about-grid">
            <div>
              <span style={{ color: '#C88A75', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>
                About Hair Artist
              </span>
              <h2 className="serif section-title" style={{ margin: '0.4rem 0 1.25rem 0' }}>
                Dipali Wakale – Hair Artist
              </h2>
              <p style={{ color: '#555', lineHeight: '1.75', marginBottom: '1rem', fontSize: '0.95rem' }}>
                Dipali Wakale is a hair artist specializing in hair transformations, hair extensions, haircuts and modern styling. Her work focuses on helping clients discover styles that complement their personality and appearance.
              </p>
              <p style={{ color: '#555', lineHeight: '1.75', marginBottom: '0', fontSize: '0.95rem' }}>
                Follow on social channels to watch live hair transformation reels, hair regrowth treatment results, extensions makeovers, and trending styling tutorials.
              </p>
            </div>

            <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', maxHeight: '380px' }}>
              <img
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800"
                alt="Hair Styling by Dipali Wakale"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Instagram, YouTube & Location Banner */}
      <section className="section-padding" style={{ backgroundColor: '#FAF8F6', borderTop: '1px solid #EBE5E0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '0.85rem' }}>
            <Instagram size={36} color="#C88A75" />
            <Youtube size={36} color="#FF0000" />
            <Phone size={36} color="#25D366" />
          </div>
          <h2 className="serif section-title">
            Connect With Dipali Wakale
          </h2>
          <p style={{ color: '#666', fontSize: '0.95rem', maxWidth: '580px', margin: '0 auto 1.25rem auto' }}>
            Follow for daily hair transformation reels, hair regrowth results, treatments & client reviews.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', color: '#555', fontSize: '0.9rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} color="#C88A75" />
              <span>Ghargaon, Sangamner – Pune Nashik Highway</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={16} color="#C88A75" />
              <a href="tel:+918805291910" style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>+91 8805291910</a> / <a href="tel:+918237108495" style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>8237108495</a>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="https://instagram.com/wakale_dipali_"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#C88A75',
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
        </div>
      </section>

    </div>
  );
};

export default HomePage;
