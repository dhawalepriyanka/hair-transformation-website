import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchProducts, deleteProduct, updateProduct } from '../../services/api';
import { Plus, Edit, Trash2, Search, LogOut, Eye, EyeOff, Scissors, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const loadAllProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts({ includeInactive: 'true' });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load hair styles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadAllProducts();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleToggleActive = async (product) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      loadAllProducts();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to deactivate style "${name}"?`)) {
      try {
        await deleteProduct(id);
        loadAllProducts();
      } catch (err) {
        alert('Failed to deactivate hair style: ' + err.message);
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: '3rem 0 5rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scissors color="#C88A75" size={24} />
              <h1 className="serif" style={{ fontSize: '2.4rem', color: '#1E1E1E', margin: 0 }}>
                Hair Style Management
              </h1>
            </div>
            <p style={{ color: '#666', marginTop: '0.25rem' }}>
              Manage Dipali Wakale catalogue hair styles, codes, prices, and visibility
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                gap: '6px'
              }}
            >
              <Plus size={18} /> Add New Hair Style
            </Link>

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
                gap: '6px'
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Dashboard Search & Table */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #EBE5E0', padding: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by code or style name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} /> Refresh List ({products.length} Items)
            </button>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading hair styles...</p>
          ) : filteredProducts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No hair styles found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #EBE5E0', color: '#888', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '0.75rem' }}>Image</th>
                    <th style={{ padding: '0.75rem' }}>Style Code</th>
                    <th style={{ padding: '0.75rem' }}>Style Name</th>
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
                            backgroundColor: product.is_active ? '#E8F5E9' : '#FFEBEE',
                            color: product.is_active ? '#2E7D32' : '#C62828'
                          }}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleToggleActive(product)}
                            title={product.is_active ? 'Hide Style' : 'Show Style'}
                            style={{ color: '#666', padding: '4px' }}
                          >
                            {product.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>

                          <button
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                            title="Edit Style"
                            style={{ color: '#C88A75', padding: '4px' }}
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            title="Deactivate Style"
                            style={{ color: '#E57373', padding: '4px' }}
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
      </div>
    </div>
  );
};

export default AdminDashboard;
