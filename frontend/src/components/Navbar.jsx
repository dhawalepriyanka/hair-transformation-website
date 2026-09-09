import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelection } from '../context/SelectionContext';
import { setAdminSession, useAdminSession } from '../services/adminSession';
import { Scissors, Menu, X, LogOut } from 'lucide-react';

const Navbar = () => {
  const isAdmin = useAdminSession();
  const { selectedCount, clearSelection } = useSelection();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleAdminLogout = () => {
    clearSelection();
    setAdminSession(null);
    setMobileMenuOpen(false);
    navigate('/admin/login');
  };

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
                Products
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
            {isAdmin && <li>
              <Link
                to="/admin/dashboard"
                className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            </li>}
            {isAdmin && <li>
              <Link
                to="/admin/product-selection"
                className={`nav-link ${isActive('/admin/product-selection') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Product Selection
              </Link>
            </li>}
            {isAdmin && <li>
              <Link
                to="/selected-styles"
                className={`nav-link ${isActive('/selected-styles') || isActive('/selected-products') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Selected Products
                {selectedCount > 0 && (
                  <span className="selected-badge">{selectedCount}</span>
                )}
              </Link>
            </li>}
            {isAdmin && <li>
              <button type="button" className="nav-link nav-logout" onClick={handleAdminLogout}>
                <LogOut size={16} /> Logout
              </button>
            </li>}
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
