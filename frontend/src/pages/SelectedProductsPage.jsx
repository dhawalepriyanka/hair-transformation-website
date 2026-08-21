import React from 'react';
import { Link } from 'react-router-dom';
import { useSelection } from '../context/SelectionContext';
import ProductCard from '../components/ProductCard';
import { Printer, ArrowLeft, Scissors, Sparkles, Trash2 } from 'lucide-react';

const SelectedProductsPage = () => {
  const { selectedStyles, selectedCount, clearSelection } = useSelection();

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="selected-products-page" style={{ padding: '3rem 0 5rem 0' }}>
      <div className="container">
        {/* PRINT ONLY HEADER - Strictly visible when window.print() is called */}
        <div className="print-only-header">
          <div className="print-header-top">
            <div>
              <h1 className="print-brand-title">Dipali Wakale</h1>
              <p className="print-brand-subtitle">Hair Artist</p>
              <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '4px' }}>
                Instagram: @wakale_dipali_ | Location: Ghargaon, Sangamner – Pune Nashik Highway
              </p>
            </div>
            <div className="print-meta-info">
              <p style={{ fontWeight: 'bold', fontSize: '1rem' }}>Selected Hair Styles</p>
              <p>Date: {currentDate}</p>
              <p>Total Items: {selectedCount}</p>
            </div>
          </div>
        </div>

        {/* SCREEN ONLY HEADER */}
        <div className="no-print" style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Link to="/hair-styles" style={{ color: '#C88A75', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: '600' }}>
                  <ArrowLeft size={16} /> Back to Hair Styles
                </Link>
              </div>
              <h1 className="serif" style={{ fontSize: '2.5rem', color: '#1E1E1E', margin: 0 }}>
                Selected Hair Styles
              </h1>
              <p style={{ color: '#666', marginTop: '0.25rem', fontWeight: '600' }}>
                {selectedCount} {selectedCount === 1 ? 'Style Selected' : 'Styles Selected'}
              </p>
            </div>

            {selectedCount > 0 && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={clearSelection}
                  style={{
                    color: '#888',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.6rem 1rem'
                  }}
                >
                  <Trash2 size={16} /> Clear Selection
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    backgroundColor: '#C88A75',
                    color: '#FFFFFF',
                    fontWeight: '600',
                    padding: '0.75rem 1.8rem',
                    borderRadius: '30px',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(200, 138, 117, 0.3)'
                  }}
                >
                  <Printer size={18} /> Print Selected Styles
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Display */}
        {selectedCount === 0 ? (
          <div
            className="no-print"
            style={{
              textAlign: 'center',
              padding: '6rem 1rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EBE5E0'
            }}
          >
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                backgroundColor: '#F7EFEA',
                color: '#C88A75',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}
            >
              <Scissors size={32} />
            </div>
            <h2 className="serif" style={{ fontSize: '2rem', color: '#1E1E1E', marginBottom: '0.5rem' }}>
              No hair styles selected yet.
            </h2>
            <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '450px', margin: '0 auto 2rem auto' }}>
              Select your favourite hair styles and they will appear here.
            </p>
            <Link
              to="/hair-styles"
              style={{
                backgroundColor: '#C88A75',
                color: '#FFFFFF',
                padding: '0.85rem 2rem',
                borderRadius: '30px',
                fontWeight: '600',
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={18} /> Browse Hair Styles
            </Link>
          </div>
        ) : (
          <>
            {/* Interactive Screen Grid */}
            <div className="product-grid no-print">
              {selectedStyles.map((product) => (
                <ProductCard key={product.id} product={product} mode="remove" />
              ))}
            </div>

            {/* Printable Grid Layout (Visible strictly during @media print) */}
            <div className="print-grid">
              {selectedStyles.map((product) => (
                <div key={product.id} className="print-card">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="print-image"
                  />
                  <div className="print-title">{product.name}</div>
                  <div className="print-code-category">
                    <span>Code: {product.product_code}</span>
                    <span>{product.category}</span>
                  </div>
                  {product.price && (
                    <div className="print-price">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      }).format(product.price)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SelectedProductsPage;
