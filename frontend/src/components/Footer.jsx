import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MapPin, Scissors, MessageCircle, Phone, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-content">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div className="logo-icon" style={{ width: '32px', height: '32px' }}>
                <Scissors size={18} />
              </div>
              <h3 className="serif" style={{ color: '#fff', fontSize: '1.5rem' }}>
                Dipali Wakale
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#BBB', lineHeight: '1.7', marginBottom: '1.5rem' }}>
              Professional Hair Artist & Skin Care Specialist. Specializing in Hair Transformations, Hair Regrowth Treatments, Extensions, Haircuts & Bridal Styling.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1.25rem' }}>
              <a
                href="https://instagram.com/wakale_dipali_"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram @wakale_dipali_"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  color: '#FFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <Instagram size={17} />
              </a>

              <a
                href="https://youtube.com/@dipali_wakale"
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube @dipali_wakale"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FF0000',
                  color: '#FFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <Youtube size={17} />
              </a>

              <a
                href="https://wa.me/918805291910?text=Hi%20Dipali%20didi,%20I'm%20interested%20in%20a%20hair%20transformation%20treatment%20appointment."
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp +91 8805291910"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#25D366',
                  color: '#FFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <MessageCircle size={17} />
              </a>

              <a
                href="tel:+918805291910"
                title="Call Studio +91 8805291910"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#C88A75',
                  color: '#FFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <Phone size={16} />
              </a>

              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Ghargaon,Sangamner,Maharashtra"
                target="_blank"
                rel="noopener noreferrer"
                title="Google Maps Location - Ghargaon, Sangamner"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#4285F4',
                  color: '#FFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <MapPin size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="footer-title">Quick Links</h4>
            <ul style={{ listStyle: 'none', lineHeight: '2.2', fontSize: '0.9rem', color: '#CCC' }}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/hair-styles">Products Catalogue</Link></li>
              <li><Link to="/transformations">Real Transformations</Link></li>
              <li><Link to="/selected-styles">Selected Products</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Specialized Services</h4>
            <ul style={{ listStyle: 'none', lineHeight: '2.2', fontSize: '0.9rem', color: '#CCC' }}>
              <li><Link to="/transformations">Hair Regrowth & Care</Link></li>
              <li><Link to="/transformations">Keratin & Botox Treatments</Link></li>
              <li><Link to="/transformations">Hair Extensions</Link></li>
              <li><Link to="/transformations">Haircut & Styling</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Contact & Studio</h4>
            <ul style={{ listStyle: 'none', lineHeight: '2.2', fontSize: '0.88rem', color: '#BBB' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={18} color="#C88A75" style={{ flexShrink: 0, marginTop: '3px' }} />
                <div>
                  <span>Ghargaon, Sangamner, Dist. Ahmednagar (Pune-Nashik Highway)</span>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=Ghargaon,Sangamner,Maharashtra"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#E0B69F', display: 'block', fontSize: '0.8rem', marginTop: '2px', fontWeight: '600', textDecoration: 'underline' }}
                  >
                    🧭 Get Directions in Google Maps
                  </a>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                <Phone size={18} color="#C88A75" />
                <a href="tel:+918805291910" style={{ color: '#BBB', textDecoration: 'none' }}>+91 8805291910</a> / <a href="tel:+918237108495" style={{ color: '#BBB', textDecoration: 'none' }}>8237108495</a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                <Instagram size={18} color="#C88A75" />
                <a href="https://instagram.com/wakale_dipali_" target="_blank" rel="noopener noreferrer" style={{ color: '#BBB', textDecoration: 'none' }}>@wakale_dipali_</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Dipali Wakale – Hair & Skin Care. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
