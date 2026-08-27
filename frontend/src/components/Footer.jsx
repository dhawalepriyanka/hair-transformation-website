import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MapPin, Scissors, MessageCircle } from 'lucide-react';

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
              Professional Hair Artist specializing in Hair Transformations, Hair Extensions, Haircuts, and Modern Styling. Select your favorite hairstyles from our catalogue and generate your printable styling sheet.
            </p>
            <div className="social-btn-group">
              <a
                href="https://instagram.com/wakale_dipali_"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-social btn-instagram"
              >
                <Instagram size={18} /> Follow @wakale_dipali_
              </a>
              <a
                href="https://wa.me/?text=Hi%20Dipali,%20I'm%20interested%20in%20a%20hair%20transformation%20appointment."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-social btn-whatsapp"
              >
                <MessageCircle size={18} /> WhatsApp Inquiry
              </a>
            </div>
          </div>

          <div>
            <h4 className="footer-title">Quick Links</h4>
            <ul style={{ listStyle: 'none', lineHeight: '2.2', fontSize: '0.9rem', color: '#CCC' }}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/hair-styles">Hair Styles</Link></li>
              <li><Link to="/transformations">Transformations</Link></li>
              <li><Link to="/selected-styles">Selected Styles</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Hair Services</h4>
            <ul style={{ listStyle: 'none', lineHeight: '2.2', fontSize: '0.9rem', color: '#CCC' }}>
              <li><Link to="/hair-styles?category=Hair%20Transformation">Hair Transformations</Link></li>
              <li><Link to="/hair-styles?category=Hair%20Extension">Hair Extensions</Link></li>
              <li><Link to="/hair-styles?category=Haircut">Haircuts & Layers</Link></li>
              <li><Link to="/hair-styles?category=Hair%20Color">Balayage & Color</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Location & Studio</h4>
            <ul style={{ listStyle: 'none', lineHeight: '2.2', fontSize: '0.88rem', color: '#BBB' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={18} color="#C88A75" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span>Ghargaon, Sangamner – Pune Nashik Highway</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                <Instagram size={18} color="#C88A75" /> @wakale_dipali_
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Dipali Wakale – Hair Artist. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
