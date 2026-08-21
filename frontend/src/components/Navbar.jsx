import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelection } from '../context/SelectionContext';
import { Scissors, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { selectedCount } = useSelection();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo-link">
          <div className="logo-icon">
            <Scissors size={18} />
          </div>
          <div className="logo-text">
            Dipali Wakale
            <span>Hair Artist</span>
          </div>
        </Link>

        <nav>
          <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <li>
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/hair-styles"
                className={`nav-link ${isActive('/hair-styles') || isActive('/products') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Hair Styles
              </Link>
            </li>
            <li>
              <Link
                to="/transformations"
                className={`nav-link ${isActive('/transformations') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Transformations
              </Link>
            </li>
            <li>
              <Link
                to="/selected-styles"
                className={`nav-link ${isActive('/selected-styles') || isActive('/selected-products') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Selected Styles
                {selectedCount > 0 && (
                  <span className="selected-badge">{selectedCount}</span>
                )}
              </Link>
            </li>
          </ul>
        </nav>

        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
