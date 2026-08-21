import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SelectionBar from '../components/SelectionBar';
import SkeletonLoader from '../components/SkeletonLoader';
import { fetchProducts } from '../services/api';
import { Search, AlertCircle, RefreshCw } from 'lucide-react';

const CATEGORIES = ['All', 'Haircut', 'Hair Transformation', 'Hair Extension', 'Hair Styling', 'Hair Color', 'Bridal Style', 'Long Hair', 'Short Hair', 'Other'];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const loadCatalogue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load hair styles', err);
      setError('Unable to load hair styles catalogue. Please check your connection or backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogue();
  }, []);

  // Update selected category when query parameter changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Client-side filtering by category & search term (no page reload)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        (product.category && product.category.toLowerCase() === selectedCategory.toLowerCase());

      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.product_code && product.product_code.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    if (category === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="products-page" style={{ padding: '3rem 0 5rem 0' }}>
      <div className="container">
        {/* Header & Subheading requested explicitly */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 className="serif" style={{ fontSize: '2.8rem', color: '#1E1E1E', marginBottom: '0.5rem' }}>
            Hair Styles Catalogue
          </h1>
          <p style={{ color: '#C88A75', fontSize: '1.15rem', fontWeight: '600', maxWidth: '650px', margin: '0 auto' }}>
            Select multiple styles to create your printable A4 sheet
          </p>
        </div>

        {/* Search & Category Filter Section */}
        <div className="filter-section">
          <div className="search-category-bar">
            {/* Search Input */}
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search hair styles by name or code (e.g. H001, Layer)..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter Tabs */}
            <ul className="category-tabs">
              {CATEGORIES.map((category) => (
                <li key={category}>
                  <button
                    type="button"
                    className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Content State Handling */}
        {loading ? (
          <SkeletonLoader count={8} />
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#FFF', borderRadius: '12px', border: '1px solid #EBE5E0' }}>
            <AlertCircle size={48} color="#E57373" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{error}</h3>
            <button
              onClick={loadCatalogue}
              style={{
                marginTop: '1rem',
                backgroundColor: '#C88A75',
                color: '#FFF',
                padding: '0.6rem 1.5rem',
                borderRadius: '20px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', background: '#FFF', borderRadius: '12px', border: '1px solid #EBE5E0' }}>
            <h3 className="serif" style={{ fontSize: '1.5rem', color: '#1E1E1E', marginBottom: '0.5rem' }}>
              No hair styles found matching your search.
            </h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Try searching with another keyword or select a different category.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                handleCategorySelect('All');
              }}
              style={{
                backgroundColor: '#C88A75',
                color: '#FFF',
                padding: '0.6rem 1.5rem',
                borderRadius: '20px',
                fontWeight: '600'
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} mode="select" />
            ))}
          </div>
        )}
      </div>

      {/* Sticky Selection Bar */}
      <SelectionBar />
    </div>
  );
};

export default ProductsPage;
