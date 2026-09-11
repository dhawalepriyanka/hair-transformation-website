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

function App() {
  return (
    <SelectionProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <div className="app-wrapper">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/hair-styles" element={<ProductsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/selected-styles" element={<Navigate to="/admin/patients" replace />} />
              <Route path="/selected-products" element={<Navigate to="/admin/patients" replace />} />
              <Route path="/transformations" element={<TransformationsPage />} />

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
  );
}

export default App;
