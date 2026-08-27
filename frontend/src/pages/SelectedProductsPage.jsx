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

  const printPages = [];
  for (let index = 0; index < selectedStyles.length; index += 6) {
    printPages.push(selectedStyles.slice(index, index + 6));
  }

  return (
    <div className="selected-products-page section-padding">
      <div className="container">
        {/* SCREEN ONLY HEADER */}
        <div className="no-print" style={{ marginBottom: '2rem' }}>
          <div className="section-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Link to="/hair-styles" style={{ color: '#C88A75', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: '600' }}>
                  <ArrowLeft size={16} /> Back to Products
                </Link>
              </div>
              <h1 className="serif section-title" style={{ margin: 0 }}>
                Selected Products
              </h1>
              <p style={{ color: '#666', marginTop: '0.2rem', fontWeight: '600', fontSize: '0.95rem' }}>
                {selectedCount} {selectedCount === 1 ? 'Product Selected' : 'Products Selected'}
              </p>
            </div>

            {selectedCount > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={clearSelection}
                  style={{
                    color: '#888',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.6rem 0.8rem'
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
                    padding: '0.7rem 1.5rem',
                    borderRadius: '30px',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(200, 138, 117, 0.3)'
                  }}
                >
                  <Printer size={18} /> Print Selected Products
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
              padding: '4.5rem 1rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EBE5E0'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#F7EFEA',
                color: '#C88A75',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}
            >
              <Scissors size={28} />
            </div>
            <h2 className="serif" style={{ fontSize: '1.8rem', color: '#1E1E1E', marginBottom: '0.4rem' }}>
              No products selected yet.
            </h2>
            <p style={{ color: '#666', marginBottom: '1.75rem', maxWidth: '420px', margin: '0 auto 1.75rem auto', fontSize: '0.9rem' }}>
              Select your favourite products and they will appear here.
            </p>
            <Link
              to="/hair-styles"
              style={{
                backgroundColor: '#C88A75',
                color: '#FFFFFF',
                padding: '0.8rem 1.8rem',
                borderRadius: '30px',
                fontWeight: '600',
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={18} /> Browse Products
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
            <div className="print-pages">
              {printPages.map((products, pageIndex) => (
                <section className="print-page" key={pageIndex}>
                  <div className="print-only-header">
                    <div className="print-header-top">
                      <div>
                        <h1 className="print-brand-title">Dipali Wakale</h1>
                        <p className="print-brand-subtitle">Hair Artist & Skin Care Specialist</p>
                        <p className="print-contact">
                          Tel: +91 8805291910 / 8237108495 | Instagram: @wakale_dipali_ | Ghargaon, Sangamner (Pune-Nashik Hwy)
                        </p>
                      </div>
                      <div className="print-meta-info">
                        <p className="print-list-title">Selected Products</p>
                        <p>Date: {currentDate}</p>
                        <p>Total Items: {selectedCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="print-grid">
                    {products.map((product) => (
                      <div key={product.id} className="print-card">
                        <img src={product.image_url} alt={product.name} className="print-image" />
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
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SelectedProductsPage;
