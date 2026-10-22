import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SelectionProvider } from './context/SelectionContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import TransformationsPage from './pages/TransformationsPage';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminPatients from './pages/admin/AdminPatients';
import PatientDetails from './pages/admin/PatientDetails';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import PatientPrintPreview from './pages/admin/PatientPrintPreview';
import { useStaffSession } from './services/adminSession';

const RoleRoute = ({ role, children }) => {
  const session = useStaffSession();
  return session?.user?.role === role ? children : <Navigate to="/admin/login" replace />;
};

const StaffRoute = ({ children }) => {
  const session = useStaffSession();
  return session?.user?.role ? children : <Navigate to="/admin/login" replace />;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#0D0807',
          color: '#F5B5A1',
          padding: '40px',
          fontFamily: 'sans-serif',
          minHeight: '100vh',
          boxSizing: 'border-box'
        }}>
          <h2>Dipali Wakale TV - Error</h2>
          <pre style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px', overflow: 'auto' }}>
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              borderRadius: '20px',
              border: 'none',
              background: '#C88A75',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // If user visits /transformations, update URL in browser address bar to /tv
  if (typeof window !== 'undefined' && window.location.pathname === '/transformations') {
    window.history.replaceState(null, '', '/tv' + window.location.search + window.location.hash);
  }

  const isTv = typeof window !== 'undefined' && (
    window.location.pathname === '/tv' ||
    window.location.pathname === '/transformations' ||
    window.location.pathname === '/index.html' ||
    window.location.search.includes('tv=1') ||
    window.location.hash.includes('tv') ||
    Boolean(window.AndroidBridge)
  );

  if (isTv) {
    return (
      <ErrorBoundary>
        <SelectionProvider>
          <TransformationsPage isTvMode={true} />
        </SelectionProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SelectionProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <div className="app-wrapper">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/index.html" element={<TransformationsPage isTvMode={true} />} />
                <Route path="/tv" element={<TransformationsPage isTvMode={true} />} />
              <Route path="/hair-styles" element={<StaffRoute><ProductsPage /></StaffRoute>} />
              <Route path="/products" element={<StaffRoute><ProductsPage /></StaffRoute>} />
              <Route path="/selected-styles" element={<Navigate to="/admin/patients" replace />} />
              <Route path="/selected-products" element={<Navigate to="/admin/patients" replace />} />
              <Route path="/transformations" element={<Navigate to="/tv" replace />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/hair-styles/admin" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/dashboard" element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
              <Route path="/admin/patients" element={<RoleRoute role="admin"><AdminPatients /></RoleRoute>} />
              <Route path="/admin/add-patient" element={<RoleRoute role="admin"><AdminPatients /></RoleRoute>} />
              <Route path="/admin/patients/:id" element={<RoleRoute role="admin"><PatientDetails /></RoleRoute>} />
              <Route path="/admin/patients/:id/print" element={<RoleRoute role="admin"><PatientPrintPreview /></RoleRoute>} />
              <Route path="/receptionist" element={<RoleRoute role="receptionist"><ReceptionistDashboard /></RoleRoute>} />
              <Route path="/receptionist/add-patient" element={<RoleRoute role="receptionist"><ReceptionistDashboard /></RoleRoute>} />
              <Route path="/admin/product-selection" element={<Navigate to="/admin/patients" replace />} />
              <Route path="/admin/products/add" element={<RoleRoute role="admin"><AdminProductForm /></RoleRoute>} />
              <Route path="/admin/styles/add" element={<RoleRoute role="admin"><AdminProductForm /></RoleRoute>} />
              <Route path="/admin/products/edit/:id" element={<RoleRoute role="admin"><AdminProductForm /></RoleRoute>} />
              <Route path="/admin/styles/edit/:id" element={<RoleRoute role="admin"><AdminProductForm /></RoleRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </SelectionProvider>
  </ErrorBoundary>
  );
}

export default App;
