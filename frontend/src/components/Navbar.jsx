import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelection } from '../context/SelectionContext';
import { setAdminSession, useAdminSession, useStaffSession } from '../services/adminSession';
import { Menu, X, LogOut } from 'lucide-react';
import BrandLogo from './BrandLogo';

const Navbar = () => {
  const isAdmin = useAdminSession();
  const staffSession = useStaffSession();
  const isReceptionist = staffSession?.user?.role === 'receptionist';
  const { clearSelection } = useSelection();
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
          <BrandLogo />
        </Link>

        <nav>
          <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {!isAdmin && <li>
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
            </li>}
            {!staffSession && <li>
              <Link
                to="/hair-styles"
                className={`nav-link ${isActive('/hair-styles') || isActive('/products') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
            </li>}
            {!staffSession && <li>
              <Link
                to="/transformations"
                className={`nav-link ${isActive('/transformations') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Transformations
              </Link>
            </li>}
            {!staffSession && <li>
              <Link
                to="/admin/login"
                className={`nav-link ${isActive('/admin') || isActive('/admin/login') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            </li>}
            {isReceptionist && <li><Link to="/receptionist" className={`nav-link ${isActive('/receptionist') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Receptionist Dashboard</Link></li>}
            {isReceptionist && <li><Link to="/receptionist/add-patient#patient-form" className={`nav-link ${isActive('/receptionist/add-patient') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Add Patient</Link></li>}
            {isAdmin && <li>
              <Link
                to="/admin/dashboard"
                className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            </li>}
            {isAdmin && <li><Link to="/admin/patients" className={`nav-link ${location.pathname.startsWith('/admin/patients') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Today’s Patients</Link></li>}
            {isAdmin && <li><Link to="/admin/add-patient" className={`nav-link ${isActive('/admin/add-patient') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Add Patient</Link></li>}
            {staffSession && <li>
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
