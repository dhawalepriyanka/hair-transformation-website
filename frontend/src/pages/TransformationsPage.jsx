import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Scissors, Sparkles, ArrowRight } from 'lucide-react';

const TransformationsPage = () => {
  const transformations = [
    {
      id: 1,
      title: 'Full Length Hair Extension Transformation',
      category: 'Hair Extensions',
      image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800',
      description: 'Added 22 inches of 100% natural human hair extensions for extreme length and seamless volume.'
    },
    {
      id: 2,
      title: 'Butterfly Haircut & Layers Makeover',
      category: 'Haircut Transformation',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
      description: 'Transformed heavy dull hair into airy, voluminous butterfly layers with curtain bangs.'
    },
    {
      id: 3,
      title: 'Honey Blonde Balayage & Gloss Finish',
      category: 'Color Transformation',
      image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800',
      description: 'Custom hand-painted balayage highlights giving multi-dimensional sun-kissed radiance.'
    },
    {
      id: 4,
      title: 'Chic Short Bob Cut Makeover',
      category: 'Haircut Makeover',
      image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=800',
      description: 'Bold style shift from damaged long ends to a sharp, modern textured bob cut.'
    },
    {
      id: 5,
      title: 'Voluminous Curtain Layers & Soft Waves',
      category: 'Styling Transformation',
      image: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&q=80&w=800',
      description: 'Face-framing curtain bangs styled with bouncy beach waves for effortless daily glamour.'
    },
    {
      id: 6,
      title: 'Royal Bridal Hair Updo & Extension Blend',
      category: 'Bridal Styling',
      image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800',
      description: 'Intricate traditional bridal hairstyle blended with extensions for dense crown volume.'
    }
  ];

  return (
    <div className="transformations-page section-padding">
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F7EFEA',
              color: '#C88A75',
              padding: '6px 16px',
              borderRadius: '30px',
              fontSize: '0.85rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}
          >
            <Sparkles size={16} /> Dipali Wakale Transformations Gallery
          </span>
          <h1 className="serif section-title">
            Hair Transformations Showcase
          </h1>
          <p style={{ color: '#666', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
            Real client transformations, hair extensions makeovers, and haircut style shifts by Dipali Wakale.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="transformations-grid" style={{ marginBottom: '3.5rem' }}>
          {transformations.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #EBE5E0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ height: '260px', overflow: 'hidden' }}>
                <img
                  src={item.image}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '1.25rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: '#C88A75',
                    letterSpacing: '0.5px'
                  }}
                >
                  {item.category}
                </span>
                <h3 className="serif" style={{ fontSize: '1.2rem', color: '#1E1E1E', margin: '0.3rem 0 0.5rem 0' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.6' }}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA to Catalogue & Instagram */}
        <div
          style={{
            backgroundColor: '#FAF8F6',
            borderRadius: '20px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            border: '1px solid #EBE5E0'
          }}
        >
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
                backgroundColor: '#C88A75',
                color: '#FFF',
                padding: '0.8rem 1.8rem',
                borderRadius: '30px',
                fontWeight: '600',
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Browse Hair Styles Catalogue <ArrowRight size={18} />
            </Link>
            <a
              href="https://instagram.com/wakale_dipali_"
              target="_blank"
              rel="noopener noreferrer"
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
