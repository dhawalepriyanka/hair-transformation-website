import React, { useEffect, useRef, useState } from 'react';
import { validateMediaFile, validateVideoSource, isInstagramUrl } from '../../services/transformationMedia.js';
import { setAdminSession, getStaffSession } from '../../services/adminSession';
import { Link, useNavigate } from 'react-router-dom';
import { compressImageFile, fileToOptimizedDataUri, compressDataUri } from '../../services/imageOptimizer.js';
import {
  fetchProducts, deleteProduct, updateProduct,
  fetchTransformations, createTransformation, updateTransformation, deleteTransformation,
  fetchSlideshowSettings, saveSlideshowSettings, DEFAULT_SLIDESHOW_SETTINGS,
  uploadTransformationMediaFile, clearBulkyLocalStorage
} from '../../services/api';
import {
  Plus, Edit, Trash2, Search, LogOut, Eye, EyeOff,
  Sparkles, RefreshCw, Package, Star, X, Check, Image, Upload, FolderOpen, Video,
  Tv, Clock, Settings, Users, ChevronUp, ChevronDown, ListOrdered
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

  // 55" TV & Slideshow Settings state
  const [slideshowModalOpen, setSlideshowModalOpen] = useState(false);
  const [slideshowSettings, setSlideshowSettings] = useState(fetchSlideshowSettings());
  const [slideshowSavedMsg, setSlideshowSavedMsg] = useState('');

  // Transformation Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [mediaType, setMediaType] = useState('images'); // 'images' | 'image' | 'video' | 'videos'
  const [readingMedia, setReadingMedia] = useState(false);
  const [savingTransformation, setSavingTransformation] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [pairErrors, setPairErrors] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const mediaReader = useRef(null);
  const [formData, setFormData] = useState({
    clientName: '',
    village: '',
    treatment: '',
    period: '',
    rating: 5,
    testimonial: '',
    before: '',
    after: '',
    image: '',
    video: '', beforeVideo: '', afterVideo: '',
    duration: '',
    category: 'Hair Extensions'
  });

  const navigate = useNavigate();

  const handleFileUpload = async (e, field) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      validateMediaFile(file, field);
    } catch (error) {
      alert(error.message);
      return;
    }
    mediaReader.current?.abort();
    setReadingMedia(true);
    setUploadStatus(prev => ({ ...prev, [field]: 'optimizing' }));

    try {
      if (file.type.startsWith('image/')) {
        // 1. Optimize & compress image in browser (reduces 8MB to ~150KB)
        const compressed = await compressImageFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
        const localPreview = await fileToOptimizedDataUri(compressed);
        setFormData(prev => ({ ...prev, [field]: localPreview }));
        if (field === 'video') setVideoError('');
        setPairErrors(prev => ({ ...prev, [field]: '' }));

        // 2. Upload to Cloud / Persistent Storage
        setUploadStatus(prev => ({ ...prev, [field]: 'uploading' }));
        const uploadedUrl = await uploadTransformationMediaFile(compressed, field);
        if (uploadedUrl && typeof uploadedUrl === 'string') {
          setFormData(prev => ({ ...prev, [field]: uploadedUrl }));
        }
      } else {
        // Video file
        setUploadStatus(prev => ({ ...prev, [field]: 'reading' }));
        const reader = new FileReader();
        mediaReader.current = reader;
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const rawBase64 = await base64Promise;
        setFormData(prev => ({ ...prev, [field]: rawBase64 }));
        if (field === 'video') setVideoError('');
        setPairErrors(prev => ({ ...prev, [field]: '' }));

        // Upload video to Cloud / Backend
        setUploadStatus(prev => ({ ...prev, [field]: 'uploading' }));
        const uploadedUrl = await uploadTransformationMediaFile(file, field);
        if (uploadedUrl && typeof uploadedUrl === 'string') {
          setFormData(prev => ({ ...prev, [field]: uploadedUrl }));
        }
      }
      setUploadStatus(prev => ({ ...prev, [field]: 'ready' }));
    } catch (err) {
      console.warn('File processing note:', err.message);
    } finally {
      setReadingMedia(false);
    }
  };

  useEffect(() => () => mediaReader.current?.abort(), []);

  useEffect(() => {
    mediaReader.current?.abort();
    setReadingMedia(false);
    setVideoError('');
    setPairErrors({});
  }, [modalOpen, mediaType]);

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
    clearBulkyLocalStorage();
    const session = getStaffSession();
    if (session?.user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadAllProducts();
    loadAllTransformations();
  }, [navigate]);

  const handleLogout = () => {
    setAdminSession(null);
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

  // 55" TV & Slideshow Settings handler
  const handleSaveSlideshowSettings = (e) => {
    e.preventDefault();
    try {
      const saved = saveSlideshowSettings(slideshowSettings);
      setSlideshowSettings(saved);
      setSlideshowModalOpen(false);
      setSlideshowSavedMsg('Slideshow settings saved successfully! 55″ TV display will use these timings.');
      setTimeout(() => setSlideshowSavedMsg(''), 4000);
    } catch (err) {
      alert('Failed to save slideshow settings: ' + err.message);
    }
  };

  // Transformation actions
  const openAddModal = () => {
    setEditingItem(null);
    setMediaType('images');
    setFormData({
      clientName: '',
      village: '',
      treatment: '',
      period: '',
      rating: 5,
      testimonial: '',
      before: '',
      after: '',
      image: '',
      video: '', beforeVideo: '', afterVideo: '',
      duration: '',
      displayOrder: transformations.length + 1,
      category: 'Hair Extensions'
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    const initialMediaType = item.beforeVideo || item.afterVideo
      ? 'videos'
      : item.video
        ? 'video'
        : item.image
          ? 'image'
          : 'images';
    setMediaType(initialMediaType);
    setFormData({
      clientName: item.clientName || '',
      village: item.village || '',
      treatment: item.treatment || '',
      period: item.period || '',
      rating: item.rating || 5,
      testimonial: item.testimonial || '',
      before: item.before || '',
      after: item.after || '',
      image: item.image || '',
      video: item.video || '',
      beforeVideo: item.beforeVideo || '',
      afterVideo: item.afterVideo || '',
      duration: item.duration || '',
      displayOrder: item.displayOrder !== undefined ? String(item.displayOrder) : '',
      category: item.category || 'Hair Extensions'
    });
    setModalOpen(true);
  };

  const handleMoveTransformation = async (item, direction) => {
    const list = [...transformations];
    const currentIndex = list.findIndex(t => String(t.id) === String(item.id));
    if (currentIndex === -1) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap items
    const [moved] = list.splice(currentIndex, 1);
    list.splice(targetIndex, 0, moved);

    // Assign sequential displayOrder
    const updatedList = list.map((t, idx) => ({
      ...t,
      displayOrder: idx + 1
    }));

    setTransformations(updatedList);
    try {
      saveStoredTransformations(updatedList);
      safeSaveLocalStorage('admin_transformations', updatedList);
      broadcastTransformationsChange('reorder', updatedList);
      // Persist to backend
      for (const t of updatedList) {
        updateTransformation(t.id, { displayOrder: t.displayOrder }).catch(() => {});
      }
    } catch (err) {
      console.warn('Reorder save notice:', err.message);
    }
  };

  const handleSaveTransformation = async (e) => {
    e.preventDefault();
    if (readingMedia || savingTransformation) return;
    if (mediaType === 'images' && (!formData.before || !formData.after)) {
      alert('Please add both Before and After images, or choose Video/Single Photo instead.');
      return;
    }
    if (mediaType === 'image' && !formData.image) {
      alert('Please choose or enter a Photo for this transformation.');
      return;
    }
    if (mediaType === 'video' && !formData.video) {
      alert('Please choose a video file or paste a direct video URL.');
      return;
    }
    let mediaData = { ...formData };
    if (mediaType === 'videos') {
      mediaData = { ...mediaData, before: '', after: '', image: '', video: '' };
    } else if (mediaType === 'video') {
      mediaData = { ...mediaData, before: '', after: '', image: '', beforeVideo: '', afterVideo: '' };
    } else if (mediaType === 'image') {
      mediaData = { ...mediaData, before: '', after: '', video: '', beforeVideo: '', afterVideo: '' };
    } else {
      mediaData = { ...mediaData, image: '', video: '', beforeVideo: '', afterVideo: '' };
    }

    if (formData.duration) {
      const dur = parseInt(formData.duration, 10);
      mediaData.duration = !isNaN(dur) && dur > 0 ? dur : undefined;
    } else {
      mediaData.duration = undefined;
    }

    if (formData.displayOrder) {
      const ord = parseInt(formData.displayOrder, 10);
      mediaData.displayOrder = !isNaN(ord) ? ord : undefined;
    } else {
      mediaData.displayOrder = undefined;
    }

    try {
      if (mediaType === 'video') {
        if (!isInstagramUrl(mediaData.video)) {
          mediaData.video = validateVideoSource(mediaData.video);
          if (videoError) throw new Error(videoError);
        } else {
          mediaData.video = mediaData.video.trim();
        }
      }
      if (mediaType === 'videos') {
        if (!mediaData.beforeVideo || !mediaData.afterVideo) throw new Error('Please add both Before and After videos.');
        mediaData.beforeVideo = validateVideoSource(mediaData.beforeVideo);
        mediaData.afterVideo = validateVideoSource(mediaData.afterVideo);
        if (pairErrors.beforeVideo || pairErrors.afterVideo) throw new Error('Please replace the video that could not be played.');
      }
      setSavingTransformation(true);
      // Ensure any large base64 data URIs are compressed down to web-friendly sizes (< 200KB)
      for (const f of ['before', 'after', 'image']) {
        if (typeof mediaData[f] === 'string' && mediaData[f].startsWith('data:image/')) {
          mediaData[f] = await compressDataUri(mediaData[f], 1600, 1600, 0.80);
        }
      }

      if (editingItem) {
        await updateTransformation(editingItem.id, mediaData);
      } else {
        await createTransformation(mediaData);
      }
      setModalOpen(false);
      await loadAllTransformations();
    } catch (err) {
      alert('Failed to save transformation: ' + err.message);
    } finally {
      setSavingTransformation(false);
    }
  };

  const handleDeleteTransformation = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete transformation for "${name}"?`)) {
      try {
        await deleteTransformation(id);
        await loadAllTransformations();
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
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setSlideshowModalOpen(true)}
                  style={{
                    backgroundColor: '#1E1E1E',
                    color: '#FFF',
                    padding: '0.7rem 1.3rem',
                    borderRadius: '30px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
                  }}
                  title="Configure 55″ TV display settings and auto-switch video timings"
                >
                  <Tv size={17} color="#F5A58D" /> 55″ TV & Video Time
                </button>

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
              </div>
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

        {slideshowSavedMsg && (
          <div style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.92rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #C8E6C9', boxShadow: '0 2px 8px rgba(46,125,50,0.08)' }}>
            <Check size={18} /> {slideshowSavedMsg}
          </div>
        )}

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
                      <th style={{ padding: '0.75rem', width: '90px' }}>Slide #</th>
                      <th style={{ padding: '0.75rem' }}>Before & After</th>
                      <th style={{ padding: '0.75rem' }}>Client Name</th>
                      <th style={{ padding: '0.75rem' }}>Village / City</th>
                      <th style={{ padding: '0.75rem' }}>Treatment & Category</th>
                      <th style={{ padding: '0.75rem' }}>Period</th>
                      <th style={{ padding: '0.75rem' }}>Rating</th>
                      <th style={{ padding: '0.75rem' }}>Display Time</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransformations.map((item, index) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F4EFEA' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '800', color: '#9A5F4D', background: '#F7EFEA', padding: '3px 8px', borderRadius: '8px', fontSize: '0.8rem', minWidth: '32px', textAlign: 'center' }}>
                              #{index + 1}
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveTransformation(item, -1)}
                                title="Move slide up in sequence"
                                style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.25 : 1, padding: 0, color: '#C88A75', display: 'flex', alignItems: 'center' }}
                              >
                                <ChevronUp size={15} />
                              </button>
                              <button
                                type="button"
                                disabled={index === filteredTransformations.length - 1}
                                onClick={() => handleMoveTransformation(item, 1)}
                                title="Move slide down in sequence"
                                style={{ background: 'none', border: 'none', cursor: index === filteredTransformations.length - 1 ? 'not-allowed' : 'pointer', opacity: index === filteredTransformations.length - 1 ? 0.25 : 1, padding: 0, color: '#C88A75', display: 'flex', alignItems: 'center' }}
                              >
                                <ChevronDown size={15} />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {(item.video || item.beforeVideo) && !item.before && !item.after ? (
                              <span title="Video transformation" style={{ width: '80px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', borderRadius: '4px', color: '#FFF', background: '#C88A75', fontSize: '0.72rem', fontWeight: '700' }}>
                                <Video size={17} /> {item.beforeVideo ? 'BEFORE / AFTER' : 'VIDEO'}
                              </span>
                            ) : item.image && !item.before && !item.after ? (
                              <img
                                src={item.image}
                                alt="Instagram Photo"
                                title="Instagram Photo"
                                style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #C88A75' }}
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200'; }}
                              />
                            ) : <>
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
                            {item.video && (
                              <span title="Video included" style={{ width: '38px', height: '38px', display: 'grid', placeItems: 'center', borderRadius: '4px', color: '#FFF', background: '#C88A75' }}>
                                <Video size={17} />
                              </span>
                            )}
                            </>}
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
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            padding: '3px 9px',
                            borderRadius: '12px',
                            background: item.duration ? '#FFF0EC' : '#F5F5F5',
                            color: item.duration ? '#C88A75' : '#666',
                            border: `1px solid ${item.duration ? '#F2C8BD' : '#E0E0E0'}`
                          }}>
                            <Clock size={12} />
                            {item.duration ? `${item.duration}s` : (item.video || item.beforeVideo ? `${slideshowSettings.videoDuration}s (Def)` : `${slideshowSettings.imageDuration}s (Def)`)}
                          </span>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '5px', color: '#C88A75' }} />
                      Slide Display Time (sec)
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="180"
                      placeholder={`Default (${slideshowSettings.videoDuration}s / ${slideshowSettings.imageDuration}s)`}
                      value={formData.duration || ''}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CCC' }}
                    />
                    <span style={{ fontSize: '0.74rem', color: '#777', marginTop: '3px', display: 'block' }}>
                      Custom seconds or leave blank for global TV timing.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      <ListOrdered size={14} style={{ verticalAlign: 'middle', marginRight: '5px', color: '#C88A75' }} />
                      Slide Sequence (Order #)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 1, 2, 3..."
                      value={formData.displayOrder || ''}
                      onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CCC' }}
                    />
                    <span style={{ fontSize: '0.74rem', color: '#777', marginTop: '3px', display: 'block' }}>
                      Position in TV rotation (lower numbers play first).
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', marginBottom: '0.5rem' }}>Choose Transformation Media *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <button type="button" onClick={() => setMediaType('images')} style={{ padding: '0.7rem', borderRadius: '8px', border: `1.5px solid ${mediaType === 'images' ? '#C88A75' : '#DDD'}`, background: mediaType === 'images' ? '#F7EFEA' : '#FFF', color: mediaType === 'images' ? '#9A5F4D' : '#666', fontWeight: '700', cursor: 'pointer' }}>
                      <Image size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Before & After Images
                    </button>
                    <button type="button" onClick={() => setMediaType('image')} style={{ padding: '0.7rem', borderRadius: '8px', border: `1.5px solid ${mediaType === 'image' ? '#C88A75' : '#DDD'}`, background: mediaType === 'image' ? '#F7EFEA' : '#FFF', color: mediaType === 'image' ? '#9A5F4D' : '#666', fontWeight: '700', cursor: 'pointer' }}>
                      <Image size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Single Photo (Instagram)
                    </button>
                    <button type="button" onClick={() => setMediaType('video')} style={{ padding: '0.7rem', borderRadius: '8px', border: `1.5px solid ${mediaType === 'video' ? '#C88A75' : '#DDD'}`, background: mediaType === 'video' ? '#F7EFEA' : '#FFF', color: mediaType === 'video' ? '#9A5F4D' : '#666', fontWeight: '700', cursor: 'pointer' }}>
                      <Video size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Video Only (Reel)
                    </button>
                    <button type="button" aria-pressed={mediaType === 'videos'} onClick={() => setMediaType('videos')} style={{ padding: '0.7rem', borderRadius: '8px', border: mediaType === 'videos' ? '1.5px solid #C88A75' : '1.5px solid #DDD', background: mediaType === 'videos' ? '#F7EFEA' : '#FFF', color: mediaType === 'videos' ? '#9A5F4D' : '#666', fontWeight: '700', cursor: 'pointer' }}>
                      <Video size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Before & After Videos
                    </button>
                  </div>
                  <p style={{ margin: '0.45rem 0 0', color: '#777', fontSize: '0.78rem' }}>Choose Before & After comparison, an Instagram photo, or a video reel.</p>
                </div>

                {mediaType === 'images' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
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
                </div>}

                {mediaType === 'image' && (
                  <div style={{ background: '#FAF8F6', padding: '1rem', borderRadius: '12px', border: '1px solid #EBE5E0', marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#1E1E1E', marginBottom: '0.4rem' }}>
                      Transformation Photo (Instagram Post / Clinic Picture) *
                    </label>

                    <div style={{ marginBottom: '0.6rem' }}>
                      <label
                        htmlFor="single-image-file-upload"
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
                        id="single-image-file-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'image')}
                      />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center', marginBottom: '0.4rem' }}>— or paste image path / URL —</div>

                    <input
                      type="text"
                      placeholder="e.g. /instagram/salon-client.jpg or https://..."
                      value={formData.image.startsWith('data:') ? '[Local PC Image Selected]' : formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.82rem' }}
                    />

                    {formData.image && isInstagramUrl(formData.image) ? (
                      <div style={{ marginTop: '0.6rem', padding: '0.75rem', background: '#FFF5F2', border: '1.5px solid #F2C8BD', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', display: 'grid', placeItems: 'center', color: '#FFF', fontSize: '12px' }}>📸</span>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#9A5F4D' }}>Instagram Post Connected</div>
                            <a href={formData.image} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#666', textDecoration: 'underline' }}>{formData.image}</a>
                          </div>
                        </div>
                        <button type="button" onClick={() => setFormData({ ...formData, image: '' })} style={{ background: '#FFEBEE', color: '#C62828', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>
                      </div>
                    ) : formData.image ? (
                      <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={formData.image}
                          alt="Photo Preview"
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #C88A75' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          style={{ background: '#FFEBEE', color: '#C62828', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {mediaType === 'videos' && <div className="transformation-video-pair-inputs">
                  {[['beforeVideo', 'Before Video'], ['afterVideo', 'After Video']].map(([field, label]) => (
                    <div key={field} style={{ background: '#FAF8F6', padding: '1rem', borderRadius: '12px', border: '1px solid #EBE5E0' }}>
                      <label htmlFor={field + '-file'} style={{ display: 'block', fontWeight: '700', marginBottom: '0.6rem' }}>{label} *</label>
                      <label htmlFor={field + '-file'} style={{ display: 'block', textAlign: 'center', padding: '0.8rem', border: '1.5px dashed #C88A75', borderRadius: '8px', color: '#9A5F4D', background: '#FFF', cursor: 'pointer' }}>
                        <Video size={16} /> Choose {label} (max 100MB)
                      </label>
                      <input id={field + '-file'} type="file" accept="video/mp4,video/webm,video/ogg" disabled={readingMedia} style={{ display: 'none' }} onChange={e => handleFileUpload(e, field)} />
                      <p style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center' }}>— or paste direct video URL —</p>
                      <input type="url" aria-label={label + ' URL'} placeholder="https://example.com/video.mp4" disabled={readingMedia} value={formData[field].startsWith('data:') ? '' : formData[field]} onChange={e => { setPairErrors(prev => ({ ...prev, [field]: '' })); setFormData(prev => ({ ...prev, [field]: e.target.value })); }} style={{ width: '100%', padding: '0.55rem', border: '1px solid #CCC', borderRadius: '6px' }} />
                      {formData[field].startsWith('data:') && <p role="status">Local video selected</p>}
                      {pairErrors[field] && <p role="alert" style={{ color: '#C62828' }}>{pairErrors[field]}</p>}
                      {formData[field] && <>
                        <video key={formData[field]} src={formData[field]} controls muted playsInline preload="metadata" onLoadedMetadata={() => setPairErrors(prev => ({ ...prev, [field]: '' }))} onError={() => setPairErrors(prev => ({ ...prev, [field]: 'This video could not be played. Choose another file or check the URL.' }))} style={{ width: '100%', maxHeight: '220px', marginTop: '0.75rem', borderRadius: '8px', background: '#111' }} />
                        <button type="button" onClick={() => { setFormData(prev => ({ ...prev, [field]: '' })); setPairErrors(prev => ({ ...prev, [field]: '' })); }} style={{ background: '#FFEBEE', color: '#C62828', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>Remove {label}</button>
                      </>}
                    </div>
                  ))}
                  <p role="status" style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#777' }}>{readingMedia ? 'Reading media…' : 'MP4, WebM or Ogg · Up to 100MB per video. Both videos are required.'}</p>
                </div>}

                {mediaType === 'video' && <div style={{ background: '#FAF8F6', padding: '1rem', borderRadius: '12px', border: '1px solid #EBE5E0', marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#1E1E1E', marginBottom: '0.4rem' }}>
                    Transformation Video *
                  </label>
                  <div style={{ marginBottom: '0.6rem' }}>
                    <label htmlFor="video-file-upload" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#FFF', border: '1.5px dashed #C88A75', color: '#C88A75', padding: '0.65rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                      <Video size={16} /> Choose Video from PC / Gallery (max 100MB)
                    </label>
                    <input id="video-file-upload" type="file" accept="video/mp4,video/webm,video/ogg" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'video')} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center', marginBottom: '0.4rem' }}>— or paste direct video / Instagram Reel URL —</div>
                  <input type="url" aria-label="Direct video URL" placeholder="https://example.com/video.mp4 or Instagram Reel URL" disabled={readingMedia} value={formData.video.startsWith('data:') ? '' : formData.video} onChange={(e) => { setVideoError(''); setFormData({ ...formData, video: e.target.value }); }} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.82rem' }} />
                  <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.4rem' }}>MP4, WebM, Ogg, or public Instagram Reel links (@wakale_dipali_).</p>
                  {readingMedia && <p role="status">Processing media…</p>}
                  {formData.video.startsWith('data:') && <p role="status">Local video selected</p>}
                  {videoError && !isInstagramUrl(formData.video) && <p role="alert" style={{ color: '#C62828' }}>{videoError}</p>}
                  {formData.video && isInstagramUrl(formData.video) ? (
                    <div style={{ marginTop: '0.75rem', padding: '0.85rem', background: '#FFF5F2', border: '1.5px solid #F2C8BD', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', display: 'grid', placeItems: 'center', color: '#FFF', fontSize: '13px' }}>📸</span>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#9A5F4D' }}>Instagram Reel Connected</div>
                            <a href={formData.video} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#666', textDecoration: 'underline' }}>{formData.video}</a>
                          </div>
                        </div>
                        <button type="button" onClick={() => { setVideoError(''); setFormData({ ...formData, video: '' }); }} style={{ background: '#FFEBEE', color: '#C62828', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Remove Video</button>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '0.76rem', color: '#A0522D', lineHeight: 1.4, background: 'rgba(255,255,255,0.7)', padding: '6px 10px', borderRadius: '6px' }}>
                        🔊 <strong>TV Auto-Voice Tip:</strong> Instagram embed links require a manual click to start voice due to Instagram's privacy rules. To make this reel <strong>automatically play voice on your TV</strong>, download the reel video and upload it above using <strong>"Choose Video from PC / Gallery"</strong>.
                      </p>
                    </div>
                  ) : formData.video ? (
                    <div style={{ marginTop: '0.75rem' }}>
                      <video key={formData.video} src={formData.video} controls muted playsInline preload="metadata" onLoadedMetadata={() => setVideoError('')} onError={() => { if (!isInstagramUrl(formData.video)) setVideoError('This video could not be played. Choose a supported file or check the direct video URL.'); }} style={{ width: '100%', maxHeight: '220px', borderRadius: '8px', background: '#111' }} />
                      <button type="button" onClick={() => { mediaReader.current?.abort(); setVideoError(''); setFormData({ ...formData, video: '' }); }} style={{ marginTop: '0.5rem', background: '#FFEBEE', color: '#C62828', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Remove Video</button>
                    </div>
                  ) : null}
                </div>}

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
                    disabled={readingMedia || savingTransformation || (mediaType === 'video' && !!videoError && !isInstagramUrl(formData.video)) || (mediaType === 'videos' && !!(pairErrors.beforeVideo || pairErrors.afterVideo))}
                    style={{ padding: '0.7rem 1.6rem', borderRadius: '25px', border: 'none', backgroundColor: '#C88A75', color: '#FFF', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Check size={16} /> {readingMedia ? 'Processing Media…' : savingTransformation ? 'Saving to Database…' : editingItem ? 'Update Transformation' : 'Save Transformation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════════════════ 55" TV & SLIDESHOW SETTINGS MODAL ════════════════════ */}
        {slideshowModalOpen && (
          <div
            onClick={() => setSlideshowModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '1rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                width: '100%',
                maxWidth: '640px',
                maxHeight: '92vh',
                overflowY: 'auto',
                padding: '2.2rem',
                boxShadow: '0 12px 50px rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ backgroundColor: '#F7EFEA', padding: '10px', borderRadius: '12px' }}>
                    <Tv size={26} color="#C88A75" />
                  </div>
                  <div>
                    <h2 className="serif" style={{ fontSize: '1.6rem', color: '#1E1E1E', margin: 0 }}>
                      55″ TV & Video Time Settings
                    </h2>
                    <p style={{ margin: '3px 0 0', color: '#777', fontSize: '0.85rem' }}>
                      Configure automatic slideshow timings & video playback for salon displays
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSlideshowModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={22} />
                </button>
              </div>

              {slideshowSavedMsg && (
                <div style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.8rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} /> {slideshowSavedMsg}
                </div>
              )}

              <form onSubmit={handleSaveSlideshowSettings}>
                {/* 1. Auto Switch Master Toggle */}
                <div style={{ background: '#FAF8F6', padding: '1rem 1.2rem', borderRadius: '12px', border: '1px solid #EBE5E0', marginBottom: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.92rem', color: '#1E1E1E' }}>
                    <input
                      type="checkbox"
                      checked={slideshowSettings.autoSwitch !== false}
                      onChange={(e) => setSlideshowSettings({ ...slideshowSettings, autoSwitch: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#C88A75' }}
                    />
                    Enable Automatic Slideshow Switching
                  </label>
                  <p style={{ margin: '0.35rem 0 0 28px', color: '#666', fontSize: '0.8rem' }}>
                    Automatically advances to the next transformation slide without manual clicks.
                  </p>
                </div>

                {/* 2. Video Time & Switching Mode (ADMIN ACCESS) */}
                <div style={{ background: '#FAF8F6', padding: '1.2rem', borderRadius: '12px', border: '1px solid #EBE5E0', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
                    <Video size={18} color="#C88A75" />
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1E1E1E' }}>
                      Video Slides Display & Switch Time
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 1rem', color: '#666', fontSize: '0.82rem' }}>
                    Set how long videos and reels play before the 55″ screen automatically moves to the next transformation.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="videoDurationMode"
                        value="fixed"
                        checked={slideshowSettings.videoDurationMode !== 'end'}
                        onChange={() => setSlideshowSettings({ ...slideshowSettings, videoDurationMode: 'fixed' })}
                        style={{ accentColor: '#C88A75' }}
                      />
                      <span>Auto-switch after fixed time limit (Recommended for continuous salon flow)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="videoDurationMode"
                        value="end"
                        checked={slideshowSettings.videoDurationMode === 'end'}
                        onChange={() => setSlideshowSettings({ ...slideshowSettings, videoDurationMode: 'end' })}
                        style={{ accentColor: '#C88A75' }}
                      />
                      <span>Auto-switch only after video finishes playing</span>
                    </label>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#333' }}>
                      Default Video Duration: <span style={{ color: '#C88A75', fontWeight: '800' }}>{slideshowSettings.videoDuration || 15} seconds</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.6rem' }}>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="1"
                        value={slideshowSettings.videoDuration || 15}
                        onChange={(e) => setSlideshowSettings({ ...slideshowSettings, videoDuration: parseInt(e.target.value, 10) })}
                        style={{ flex: 1, accentColor: '#C88A75' }}
                      />
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={slideshowSettings.videoDuration || 15}
                        onChange={(e) => setSlideshowSettings({ ...slideshowSettings, videoDuration: parseInt(e.target.value, 10) || 15 })}
                        style={{ width: '70px', padding: '0.4rem', borderRadius: '6px', border: '1px solid #CCC', textAlign: 'center', fontWeight: '700' }}
                      />
                      <span style={{ fontSize: '0.82rem', color: '#666' }}>sec</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[10, 15, 20, 30, 45].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setSlideshowSettings({ ...slideshowSettings, videoDuration: sec })}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '15px',
                            border: `1px solid ${slideshowSettings.videoDuration === sec ? '#C88A75' : '#DDD'}`,
                            background: slideshowSettings.videoDuration === sec ? '#F7EFEA' : '#FFF',
                            color: slideshowSettings.videoDuration === sec ? '#9A5F4D' : '#666',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {sec}s {sec === 15 ? '⭐' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Photo & Before/After Slide Display Time */}
                <div style={{ background: '#FAF8F6', padding: '1.2rem', borderRadius: '12px', border: '1px solid #EBE5E0', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
                    <Image size={18} color="#C88A75" />
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1E1E1E' }}>
                      Photo & Split Comparison Slide Time
                    </h3>
                  </div>

                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#333' }}>
                    Image Display Duration: <span style={{ color: '#C88A75', fontWeight: '800' }}>{slideshowSettings.imageDuration || 8} seconds</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.6rem' }}>
                    <input
                      type="range"
                      min="4"
                      max="30"
                      step="1"
                      value={slideshowSettings.imageDuration || 8}
                      onChange={(e) => setSlideshowSettings({ ...slideshowSettings, imageDuration: parseInt(e.target.value, 10) })}
                      style={{ flex: 1, accentColor: '#C88A75' }}
                    />
                    <input
                      type="number"
                      min="4"
                      max="60"
                      value={slideshowSettings.imageDuration || 8}
                      onChange={(e) => setSlideshowSettings({ ...slideshowSettings, imageDuration: parseInt(e.target.value, 10) || 8 })}
                      style={{ width: '70px', padding: '0.4rem', borderRadius: '6px', border: '1px solid #CCC', textAlign: 'center', fontWeight: '700' }}
                    />
                    <span style={{ fontSize: '0.82rem', color: '#666' }}>sec</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[5, 7, 8, 10, 12].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setSlideshowSettings({ ...slideshowSettings, imageDuration: sec })}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '15px',
                          border: `1px solid ${slideshowSettings.imageDuration === sec ? '#C88A75' : '#DDD'}`,
                          background: slideshowSettings.imageDuration === sec ? '#F7EFEA' : '#FFF',
                          color: slideshowSettings.imageDuration === sec ? '#9A5F4D' : '#666',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {sec}s {sec === 5 ? '⭐' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Fullscreen Behavior (Remove Right Side Text) */}
                <div style={{ background: '#FAF8F6', padding: '1rem 1.2rem', borderRadius: '12px', border: '1px solid #EBE5E0', marginBottom: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.92rem', color: '#1E1E1E' }}>
                    <input
                      type="checkbox"
                      checked={slideshowSettings.hideTextInFullscreen !== false}
                      onChange={(e) => setSlideshowSettings({ ...slideshowSettings, hideTextInFullscreen: e.target.checked })}
                      style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#C88A75' }}
                    />
                    <div>
                       <span>Remove right-side text on Fullscreen / 55″ TV Mode (Recommended)</span>
                      <p style={{ margin: '0.3rem 0 0', fontWeight: '400', color: '#666', fontSize: '0.8rem' }}>
                        When fullscreen is clicked, removes the right description text so videos and photos expand to 100% full width and height on 55-inch displays.
                      </p>
                    </div>
                  </label>
                </div>

                {/* 5. Live Patient Waiting List on TV Settings */}
                <div style={{ background: '#FAF8F6', padding: '1.2rem', borderRadius: '12px', border: '1.5px solid #F2C8BD', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={18} color="#C88A75" />
                      <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '700', color: '#1E1E1E' }}>
                        Patient Waiting List (Live TV Queue Slide)
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: '#FFF5F2', color: '#9A5F4D', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                      Live on /tv
                    </span>
                  </div>
                  <p style={{ margin: '0 0 1rem', color: '#666', fontSize: '0.82rem', lineHeight: 1.4 }}>
                    Control how the Patient Waiting List slide appears on the salon TV. Shows Token numbers, Patient names, Services, and Consultation status.
                  </p>

                  {/* A. Show/Hide Toggle */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: '#1E1E1E', marginBottom: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={slideshowSettings.showPatientQueueSlide !== false}
                      onChange={(e) => setSlideshowSettings({ ...slideshowSettings, showPatientQueueSlide: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#C88A75' }}
                    />
                    Show Patient Waiting List Slide on TV
                  </label>

                  {/* B. Queue Slide Duration */}
                  <div style={{ marginBottom: '1.15rem', paddingLeft: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.84rem', fontWeight: '600', color: '#444' }}>
                        Slide Display Time on TV:
                      </label>
                      <span style={{ color: '#C88A75', fontWeight: '800', fontSize: '0.9rem' }}>
                        {slideshowSettings.queueSlideDuration || 15} seconds
                      </span>
                    </div>

                    {/* Custom Seconds Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                      <input
                        type="number"
                        min="3"
                        max="180"
                        value={slideshowSettings.queueSlideDuration || 15}
                        onChange={(e) => setSlideshowSettings({
                          ...slideshowSettings,
                          queueSlideDuration: Math.max(3, parseInt(e.target.value, 10) || 15)
                        })}
                        style={{
                          width: '100px',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          border: '1.5px solid #C88A75',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          color: '#1E1E1E'
                        }}
                      />
                      <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: '600' }}>seconds</span>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>(type custom seconds or pick below)</span>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[5, 10, 15, 20, 30, 45, 60].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setSlideshowSettings({ ...slideshowSettings, queueSlideDuration: sec })}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '15px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            border: `1px solid ${slideshowSettings.queueSlideDuration === sec ? '#C88A75' : '#DDD'}`,
                            background: slideshowSettings.queueSlideDuration === sec ? '#F7EFEA' : '#FFF',
                            color: slideshowSettings.queueSlideDuration === sec ? '#9A5F4D' : '#666'
                          }}
                        >
                          {sec}s {sec === 15 ? '⭐' : ''}
                        </button>
                      ))}
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#777', marginTop: '4px', display: 'block' }}>
                      The patient waiting list stays on screen for this duration before switching to the next transformation reel.
                    </span>
                  </div>

                  {/* C. Slide Sequence & Placement */}
                  <div style={{ marginBottom: '1.15rem', paddingLeft: '28px' }}>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: '#444', marginBottom: '0.5rem' }}>
                      Slide Sequence & Position in TV Rotation:
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '0.6rem' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: (slideshowSettings.queueSlidePlacement || 'repeat') === 'repeat' ? '#FFF5F2' : '#FFF',
                        border: `1.5px solid ${(slideshowSettings.queueSlidePlacement || 'repeat') === 'repeat' ? '#C88A75' : '#E5E5E5'}`,
                        cursor: 'pointer',
                        fontSize: '0.84rem'
                      }}>
                        <input
                          type="radio"
                          name="queueSlidePlacement"
                          checked={(slideshowSettings.queueSlidePlacement || 'repeat') === 'repeat'}
                          onChange={() => setSlideshowSettings({ ...slideshowSettings, queueSlidePlacement: 'repeat' })}
                          style={{ accentColor: '#C88A75' }}
                        />
                        <div>
                          <strong>🔄 Repeat Throughout Rotation (Recommended)</strong>
                          <div style={{ fontSize: '0.76rem', color: '#666' }}>Show patient waiting list regularly between transformation reels</div>
                        </div>
                      </label>

                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: slideshowSettings.queueSlidePlacement === 'first' ? '#FFF5F2' : '#FFF',
                        border: `1.5px solid ${slideshowSettings.queueSlidePlacement === 'first' ? '#C88A75' : '#E5E5E5'}`,
                        cursor: 'pointer',
                        fontSize: '0.84rem'
                      }}>
                        <input
                          type="radio"
                          name="queueSlidePlacement"
                          checked={slideshowSettings.queueSlidePlacement === 'first'}
                          onChange={() => setSlideshowSettings({ ...slideshowSettings, queueSlidePlacement: 'first' })}
                          style={{ accentColor: '#C88A75' }}
                        />
                        <div>
                          <strong>🥇 First Slide (#1)</strong>
                          <div style={{ fontSize: '0.76rem', color: '#666' }}>Always display waiting list as the very first screen when TV loads</div>
                        </div>
                      </label>

                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: slideshowSettings.queueSlidePlacement === 'specific' ? '#FFF5F2' : '#FFF',
                        border: `1.5px solid ${slideshowSettings.queueSlidePlacement === 'specific' ? '#C88A75' : '#E5E5E5'}`,
                        cursor: 'pointer',
                        fontSize: '0.84rem'
                      }}>
                        <input
                          type="radio"
                          name="queueSlidePlacement"
                          checked={slideshowSettings.queueSlidePlacement === 'specific'}
                          onChange={() => setSlideshowSettings({ ...slideshowSettings, queueSlidePlacement: 'specific' })}
                          style={{ accentColor: '#C88A75' }}
                        />
                        <div>
                          <strong>📍 Specific Slide Position</strong>
                          <div style={{ fontSize: '0.76rem', color: '#666' }}>Play at an exact position number in rotation</div>
                        </div>
                      </label>

                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: slideshowSettings.queueSlidePlacement === 'last' ? '#FFF5F2' : '#FFF',
                        border: `1.5px solid ${slideshowSettings.queueSlidePlacement === 'last' ? '#C88A75' : '#E5E5E5'}`,
                        cursor: 'pointer',
                        fontSize: '0.84rem'
                      }}>
                        <input
                          type="radio"
                          name="queueSlidePlacement"
                          checked={slideshowSettings.queueSlidePlacement === 'last'}
                          onChange={() => setSlideshowSettings({ ...slideshowSettings, queueSlidePlacement: 'last' })}
                          style={{ accentColor: '#C88A75' }}
                        />
                        <div>
                          <strong>🏁 Final Slide</strong>
                          <div style={{ fontSize: '0.76rem', color: '#666' }}>Show waiting list at the end of all transformation reels before looping</div>
                        </div>
                      </label>
                    </div>

                    {/* Sub-setting: Repeat Frequency */}
                    {(slideshowSettings.queueSlidePlacement || 'repeat') === 'repeat' && (
                      <div style={{ background: '#FFF', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E5E5E5', marginBottom: '0.6rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#444', marginBottom: '0.3rem' }}>
                          Repeat Interval:
                        </label>
                        <select
                          value={slideshowSettings.queueSlideFrequency || 2}
                          onChange={(e) => setSlideshowSettings({ ...slideshowSettings, queueSlideFrequency: parseInt(e.target.value, 10) })}
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.84rem' }}
                        >
                          <option value={1}>Show after every 1 transformation video</option>
                          <option value={2}>Show after every 2 transformation videos (Default)</option>
                          <option value={3}>Show after every 3 transformation videos</option>
                          <option value={4}>Show after every 4 transformation videos</option>
                          <option value={5}>Show after every 5 transformation videos</option>
                        </select>
                      </div>
                    )}

                    {/* Sub-setting: Specific Slide Position */}
                    {slideshowSettings.queueSlidePlacement === 'specific' && (
                      <div style={{ background: '#FFF', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E5E5E5', marginBottom: '0.6rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#444', marginBottom: '0.3rem' }}>
                          Insert at Slide Number:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={Math.max(10, transformations.length + 1)}
                          value={slideshowSettings.queueSlideSpecificIndex || 1}
                          onChange={(e) => setSlideshowSettings({
                            ...slideshowSettings,
                            queueSlideSpecificIndex: Math.max(1, parseInt(e.target.value, 10) || 1)
                          })}
                          style={{ width: '100px', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.84rem' }}
                        />
                        <span style={{ fontSize: '0.74rem', color: '#777', marginLeft: '8px' }}>
                          (e.g. 1 = first slide, 2 = after slide #1, 3 = after slide #2)
                        </span>
                      </div>
                    )}

                    {/* Live Sequence Preview Box */}
                    <div style={{ background: '#2B2B2B', color: '#FFF', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#D4A373', fontWeight: '700' }}>📺 TV Rotation Preview:</span>
                      {slideshowSettings.queueSlidePlacement === 'first' && (
                        <span><strong style={{ color: '#52B788' }}>[Waiting List {slideshowSettings.queueSlideDuration || 15}s]</strong> ➔ [Reel 1] ➔ [Reel 2] ➔ [Reel 3] ➔ ↻</span>
                      )}
                      {slideshowSettings.queueSlidePlacement === 'last' && (
                        <span>[Reel 1] ➔ [Reel 2] ➔ [Reel 3] ➔ <strong style={{ color: '#52B788' }}>[Waiting List {slideshowSettings.queueSlideDuration || 15}s]</strong> ➔ ↻</span>
                      )}
                      {slideshowSettings.queueSlidePlacement === 'specific' && (
                        <span>
                          {(slideshowSettings.queueSlideSpecificIndex || 1) === 1
                            ? <> <strong style={{ color: '#52B788' }}>[Waiting List (Slide #1)]</strong> ➔ [Reel 1] ➔ [Reel 2] ➔ ↻</>
                            : <> [Reel 1] ➔ <strong style={{ color: '#52B788' }}>[Waiting List (Slide #{slideshowSettings.queueSlideSpecificIndex || 2})]</strong> ➔ [Reel 2] ➔ ↻</>
                          }
                        </span>
                      )}
                      {(slideshowSettings.queueSlidePlacement || 'repeat') === 'repeat' && (
                        <span>
                          [Reel 1]
                          {(slideshowSettings.queueSlideFrequency || 2) === 1
                            ? <> ➔ <strong style={{ color: '#52B788' }}>[Waiting List]</strong> ➔ [Reel 2] ➔ <strong style={{ color: '#52B788' }}>[Waiting List]</strong> ➔ ↻</>
                            : <> ➔ [Reel 2] ➔ <strong style={{ color: '#52B788' }}>[Waiting List {slideshowSettings.queueSlideDuration || 15}s]</strong> ➔ [Reel 3] ➔ ↻</>
                          }
                        </span>
                      )}
                    </div>
                  </div>

                  {/* D. Show Sample Appointments Toggle */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: '#333', paddingLeft: '28px' }}>
                    <input
                      type="checkbox"
                      checked={slideshowSettings.queueAutoDemo !== false}
                      onChange={(e) => setSlideshowSettings({ ...slideshowSettings, queueAutoDemo: e.target.checked })}
                      style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#C88A75' }}
                    />
                    <span>
                      <strong>Show Sample Clinic Appointments</strong> when no live patients are in the waiting queue
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <a
                    href="/tv"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#C88A75',
                      fontWeight: '700',
                      fontSize: '0.88rem',
                      textDecoration: 'none'
                    }}
                  >
                    <Tv size={16} /> Open 55″ TV Display Page ↗
                  </a>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setSlideshowModalOpen(false)}
                      style={{ padding: '0.7rem 1.3rem', borderRadius: '25px', border: '1px solid #CCC', background: '#FFF', color: '#666', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '0.7rem 1.6rem', borderRadius: '25px', border: 'none', backgroundColor: '#C88A75', color: '#FFF', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Check size={16} /> Save Timings & TV Settings
                    </button>
                  </div>
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
