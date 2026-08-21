import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createProduct, fetchProductById, updateProduct } from '../../services/api';
import { ArrowLeft, Save } from 'lucide-react';

const CATEGORIES = ['Haircut', 'Hair Transformation', 'Hair Extension', 'Hair Styling', 'Hair Color', 'Bridal Style', 'Long Hair', 'Short Hair', 'Other'];

const AdminProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    product_code: '',
    category: 'Haircut',
    image_url: '',
    price: '',
    description: '',
    is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    if (isEdit) {
      const loadProduct = async () => {
        try {
          const product = await fetchProductById(id);
          if (product) {
            setFormData({
              name: product.name || '',
              product_code: product.product_code || '',
              category: product.category || 'Haircut',
              image_url: product.image_url || '',
              price: product.price || '',
              description: product.description || '',
              is_active: product.is_active !== false
            });
          }
        } catch (err) {
          setError('Failed to fetch hair style details.');
        }
      };
      loadProduct();
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        await updateProduct(id, formData);
      } else {
        await createProduct(formData);
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '3rem 0 5rem 0' }}>
      <div className="container" style={{ maxWidth: '700px' }}>
        <Link
          to="/admin/dashboard"
          style={{ color: '#C88A75', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '1.5rem', fontWeight: '600' }}
        >
          <ArrowLeft size={16} /> Back to Hair Style Management
        </Link>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #EBE5E0', padding: '2.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <h1 className="serif" style={{ fontSize: '2rem', color: '#1E1E1E', marginBottom: '0.25rem' }}>
            {isEdit ? 'Edit Hair Style' : 'Add New Hair Style'}
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Fill in the details below to publish or update catalogue hair style
          </p>

          {error && (
            <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Style Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Long Layered Cut"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #CCC' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Style Code *
                </label>
                <input
                  type="text"
                  name="product_code"
                  required
                  placeholder="e.g. H001"
                  value={formData.product_code}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #CCC' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #CCC', backgroundColor: '#FFF' }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Price (₹) (Optional)
                </label>
                <input
                  type="number"
                  name="price"
                  placeholder="e.g. 1500"
                  value={formData.price}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #CCC' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                Image URL *
              </label>
              <input
                type="url"
                name="image_url"
                required
                placeholder="https://images.unsplash.com/..."
                value={formData.image_url}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #CCC' }}
              />
              {formData.image_url && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #DDD' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Live Image Preview</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                placeholder="Enter hair cut texture, length, styling technique details..."
                value={formData.description}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #CCC', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', accentColor: '#C88A75' }}
              />
              <label htmlFor="is_active" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                Active (Visible in hair styles catalogue)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#C88A75',
                color: '#FFF',
                padding: '0.85rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Save size={18} /> {loading ? 'Saving...' : isEdit ? 'Update Hair Style' : 'Create Hair Style'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProductForm;
