import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchProducts, deleteProduct, updateProduct,
  fetchTransformations, createTransformation, updateTransformation, deleteTransformation
} from '../../services/api';
import {
  Plus, Edit, Trash2, Search, LogOut, Eye, EyeOff,
  Sparkles, RefreshCw, Package, Star, X, Check, Image, Upload, FolderOpen
} from 'lucide-react';

const TRANSFORMATION_CATEGORIES = [
  'Hair Extensions',
  'Haircut Transformation',
  'Full Makeover',
  'Bridal Styling',
  'Color Transformation',
  'Haircut Makeover',
  'Hair Regrowth',
  'Other'
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'transformations'
  
  // Products state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');

  // Transformations state
  const [transformations, setTransformations] = useState([]);
  const [loadingTransformations, setLoadingTransformations] = useState(true);
  const [transformationSearch, setTransformationSearch] = useState('');

  // Transformation Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    clientName: '',
    village: '',
    treatment: '',
    period: '',
    rating: 5,
    testimonial: '',
    before: '',
    after: '',
    category: 'Hair Extensions'
  });

  const navigate = useNavigate();

  const handleFileUpload = (e, field) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Please choose an image file smaller than 8MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const loadAllProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await fetchProducts({ includeInactive: 'true' });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadAllTransformations = async () => {
    setLoadingTransformations(true);
    try {
      const data = await fetchTransformations();
      setTransformations(data);
    } catch (err) {
      console.error('Failed to load transformations', err);
    } finally {
      setLoadingTransformations(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadAllProducts();
    loadAllTransformations();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  // Product actions
  const handleToggleProductActive = async (product) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      loadAllProducts();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete product "${name}"?`)) {
      try {
        await deleteProduct(id);
        loadAllProducts();
      } catch (err) {
        alert('Failed to delete product: ' + err.message);
      }
    }
  };

  // Transformation actions
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      clientName: '',
      village: '',
      treatment: '',
      period: '',
      rating: 5,
      testimonial: '',
      before: '',
      after: '',
      category: 'Hair Extensions'
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      clientName: item.clientName || '',
      village: item.village || '',
      treatment: item.treatment || '',
      period: item.period || '',
      rating: item.rating || 5,
      testimonial: item.testimonial || '',
      before: item.before || '',
      after: item.after || '',
      category: item.category || 'Hair Extensions'
    });
    setModalOpen(true);
  };

  const handleSaveTransformation = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateTransformation(editingItem.id, formData);
      } else {
        await createTransformation(formData);
      }
      setModalOpen(false);
      loadAllTransformations();
    } catch (err) {
      alert('Failed to save transformation: ' + err.message);
    }
  };

  const handleDeleteTransformation = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete transformation for "${name}"?`)) {
      try {
        await deleteTransformation(id);
        loadAllTransformations();
      } catch (err) {
        alert('Failed to delete transformation: ' + err.message);
      }
    }
  };

  // Filters
  const filteredProducts = products.filter((p) =>
    (p.name && p.name.toLowerCase().includes(productSearch.toLowerCase())) ||
    (p.product_code && p.product_code.toLowerCase().includes(productSearch.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const filteredTransformations = transformations.filter((t) =>
    (t.clientName && t.clientName.toLowerCase().includes(transformationSearch.toLowerCase())) ||
    (t.village && t.village.toLowerCase().includes(transformationSearch.toLowerCase())) ||
    (t.treatment && t.treatment.toLowerCase().includes(transformationSearch.toLowerCase())) ||
    (t.category && t.category.toLowerCase().includes(transformationSearch.toLowerCase()))
  );

  return (
    <div style={{ padding: '3rem 0 5rem 0' }}>
      <div className="container">

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package color="#C88A75" size={26} />
              <h1 className="serif" style={{ fontSize: '2.3rem', color: '#1E1E1E', margin: 0 }}>
                Admin Management Portal
              </h1>
            </div>
            <p style={{ color: '#666', marginTop: '0.25rem' }}>
              Manage Dipali Wakale products catalogue and client before & after transformations
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            {activeTab === 'products' ? (
              <Link
                to="/admin/products/add"
                style={{
                  backgroundColor: '#C88A75',
                  color: '#FFF',
                  padding: '0.7rem 1.4rem',
                  borderRadius: '30px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none'
                }}
              >
                <Plus size={18} /> Add New Product
              </Link>
            ) : (
              <button
                onClick={openAddModal}
                style={{
                  backgroundColor: '#C88A75',
                  color: '#FFF',
                  padding: '0.7rem 1.4rem',
                  borderRadius: '30px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={18} /> Add New Transformation
              </button>
            )}

            <button
              onClick={handleLogout}
              style={{
                border: '1px solid #CCC',
                color: '#555',
                padding: '0.7rem 1.2rem',
                borderRadius: '30px',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#FFF',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* ── TAB SELECTOR ── */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.75rem', borderBottom: '2px solid #EBE5E0', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '25px',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeTab === 'products' ? '#C88A75' : '#F7EFEA',
              color: activeTab === 'products' ? '#FFF' : '#555',
              transition: 'all 0.2s ease'
            }}
          >
            <Package size={17} /> Products Catalogue ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('transformations')}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '25px',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeTab === 'transformations' ? '#C88A75' : '#F7EFEA',
              color: activeTab === 'transformations' ? '#FFF' : '#555',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={17} /> Before & After Transformations ({transformations.length})
          </button>
        </div>

        {/* ════════════════════ TAB 1: PRODUCTS ════════════════════ */}
        {activeTab === 'products' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #EBE5E0', padding: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search products by code, name, category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem 0.6rem 2.2rem',
                    borderRadius: '20px',
                    border: '1px solid #DDD',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <button
                onClick={loadAllProducts}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <RefreshCw size={14} /> Refresh Products ({products.length})
              </button>
            </div>

            {loadingProducts ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading products...</p>
            ) : filteredProducts.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No products found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #EBE5E0', color: '#888', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '0.75rem' }}>Image</th>
                      <th style={{ padding: '0.75rem' }}>Product Code</th>
                      <th style={{ padding: '0.75rem' }}>Product Name</th>
                      <th style={{ padding: '0.75rem' }}>Category</th>
                      <th style={{ padding: '0.75rem' }}>Price</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} style={{ borderBottom: '1px solid #F4EFEA' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <img
                            src={product.image_url}
                            alt={product.name}
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=200'; }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{product.product_code}</td>
                        <td style={{ padding: '0.75rem', fontWeight: '600' }}>{product.name}</td>
                        <td style={{ padding: '0.75rem', color: '#666' }}>{product.category}</td>
                        <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                          {product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : 'N/A'}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              backgroundColor: product.is_active !== false ? '#E8F5E9' : '#FFEBEE',
                              color: product.is_active !== false ? '#2E7D32' : '#C62828'
                            }}
                          >
                            {product.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => handleToggleProductActive(product)}
                              title={product.is_active !== false ? 'Hide Product' : 'Show Product'}
                              style={{ color: '#666', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              {product.is_active !== false ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>

                            <button
                              onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                              title="Edit Product"
                              style={{ color: '#C88A75', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              title="Delete Product"
                              style={{ color: '#E57373', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ TAB 2: TRANSFORMATIONS ════════════════════ */}
        {activeTab === 'transformations' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #EBE5E0', padding: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search client, village, treatment..."
                  value={transformationSearch}
                  onChange={(e) => setTransformationSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem 0.6rem 2.2rem',
                    borderRadius: '20px',
                    border: '1px solid #DDD',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <button
                onClick={loadAllTransformations}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <RefreshCw size={14} /> Refresh Transformations ({transformations.length})
              </button>
            </div>

            {loadingTransformations ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading transformations...</p>
            ) : filteredTransformations.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No transformations found. Click "+ Add New Transformation" to create one.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #EBE5E0', color: '#888', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '0.75rem' }}>Before & After</th>
                      <th style={{ padding: '0.75rem' }}>Client Name</th>
                      <th style={{ padding: '0.75rem' }}>Village / City</th>
                      <th style={{ padding: '0.75rem' }}>Treatment & Category</th>
                      <th style={{ padding: '0.75rem' }}>Period</th>
                      <th style={{ padding: '0.75rem' }}>Rating</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransformations.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F4EFEA' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <img
                              src={item.before}
                              alt="Before"
                              title="Before"
                              style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200'; }}
                            />
                            <img
                              src={item.after}
                              alt="After"
                              title="After"
                              style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #C88A75' }}
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200'; }}
                            />
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{item.clientName}</td>
                        <td style={{ padding: '0.75rem', color: '#555' }}>{item.village}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: '600' }}>{item.treatment}</div>
                          <span style={{ fontSize: '0.75rem', color: '#C88A75', background: '#F7EFEA', padding: '2px 6px', borderRadius: '10px' }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.85rem' }}>{item.period}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '2px', color: '#C88A75' }}>
                            {[...Array(item.rating || 5)].map((_, i) => (
                              <Star key={i} size={13} fill="#C88A75" />
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => openEditModal(item)}
                              title="Edit Transformation"
                              style={{ color: '#C88A75', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              onClick={() => handleDeleteTransformation(item.id, item.clientName)}
                              title="Delete Transformation"
                              style={{ color: '#E57373', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ ADD/EDIT TRANSFORMATION MODAL ════════════════════ */}
        {modalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '1rem'
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="serif" style={{ fontSize: '1.6rem', color: '#1E1E1E', margin: 0 }}>
                  {editingItem ? 'Edit Client Transformation' : 'Add New Client Transformation'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSaveTransformation}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      Client Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Deshmukh"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CCC' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      Village / City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nashik, Maharashtra"
                      value={formData.village}
                      onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CCC' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      Treatment Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Premium Keratin Hair Extensions"
                      value={formData.treatment}
                      onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CCC' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CCC', backgroundColor: '#FFF' }}
                    >
                      {TRANSFORMATION_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      Period / Time Taken
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. June 2024 · 3 hrs"
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CCC' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      Star Rating (1-5)
                    </label>
                    <select
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CCC', backgroundColor: '#FFF' }}
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                      <option value={3}>⭐⭐⭐ (3 Stars)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  {/* Before Image Input */}
                  <div style={{ background: '#FAF8F6', padding: '1rem', borderRadius: '12px', border: '1px solid #EBE5E0' }}>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#1E1E1E', marginBottom: '0.4rem' }}>
                      Before Image *
                    </label>

                    {/* Local File Picker Button */}
                    <div style={{ marginBottom: '0.6rem' }}>
                      <label
                        htmlFor="before-file-upload"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          backgroundColor: '#FFF',
                          border: '1.5px dashed #C88A75',
                          color: '#C88A75',
                          padding: '0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <FolderOpen size={16} /> Choose from PC / Gallery
                      </label>
                      <input
                        id="before-file-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'before')}
                      />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center', marginBottom: '0.4rem' }}>— or paste image URL —</div>

                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.before.startsWith('data:') ? '[Local PC Image Selected]' : formData.before}
                      onChange={(e) => setFormData({ ...formData, before: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.82rem' }}
                    />

                    {formData.before && (
                      <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={formData.before}
                          alt="Before Preview"
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #DDD' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, before: '' })}
                          style={{ background: '#FFEBEE', color: '#C62828', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* After Image Input */}
                  <div style={{ background: '#FAF8F6', padding: '1rem', borderRadius: '12px', border: '1px solid #EBE5E0' }}>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#1E1E1E', marginBottom: '0.4rem' }}>
                      After Image *
                    </label>

                    {/* Local File Picker Button */}
                    <div style={{ marginBottom: '0.6rem' }}>
                      <label
                        htmlFor="after-file-upload"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          backgroundColor: '#FFF',
                          border: '1.5px dashed #C88A75',
                          color: '#C88A75',
                          padding: '0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <FolderOpen size={16} /> Choose from PC / Gallery
                      </label>
                      <input
                        id="after-file-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'after')}
                      />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center', marginBottom: '0.4rem' }}>— or paste image URL —</div>

                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.after.startsWith('data:') ? '[Local PC Image Selected]' : formData.after}
                      onChange={(e) => setFormData({ ...formData, after: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.82rem' }}
                    />

                    {formData.after && (
                      <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={formData.after}
                          alt="After Preview"
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #C88A75' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, after: '' })}
                          style={{ background: '#FFEBEE', color: '#C62828', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                    Client Testimonial / Feedback Quote
                  </label>
                  <textarea
                    rows="2"
                    placeholder='"माझ्या केसांमध्ये एवढी volume येईल असं वाटलं नव्हतं! Dipali didi खूप छान करतात।"'
                    value={formData.testimonial}
                    onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CCC', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{ padding: '0.7rem 1.3rem', borderRadius: '25px', border: '1px solid #CCC', background: '#FFF', color: '#666', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={{ padding: '0.7rem 1.6rem', borderRadius: '25px', border: 'none', backgroundColor: '#C88A75', color: '#FFF', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Check size={16} /> {editingItem ? 'Update Transformation' : 'Save Transformation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;

