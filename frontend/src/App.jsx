import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SelectionProvider } from './context/SelectionContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import SelectedProductsPage from './pages/SelectedProductsPage';
import TransformationsPage from './pages/TransformationsPage';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductForm from './pages/admin/AdminProductForm';

function App() {
  return (
    <SelectionProvider>
      <Router>
        <div className="app-wrapper">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/hair-styles" element={<ProductsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/selected-styles" element={<SelectedProductsPage />} />
              <Route path="/selected-products" element={<SelectedProductsPage />} />
              <Route path="/transformations" element={<TransformationsPage />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products/add" element={<AdminProductForm />} />
              <Route path="/admin/styles/add" element={<AdminProductForm />} />
              <Route path="/admin/products/edit/:id" element={<AdminProductForm />} />
              <Route path="/admin/styles/edit/:id" element={<AdminProductForm />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </SelectionProvider>
  );
}

export default App;
