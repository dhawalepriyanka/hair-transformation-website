import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelection } from '../context/SelectionContext';
import { Check, Plus, Trash2, ArrowRight } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=800';

const ProductCard = ({ product, mode = 'select' }) => {
  const { isStyleSelected, toggleStyleSelection, removeStyle } = useSelection();
  const selected = mode === 'select' && isStyleSelected(product.id);
  const [imgSrc, setImgSrc] = useState(product.image_url || FALLBACK_IMAGE);

  const formattedPrice = product.price
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(product.price)
    : null;

  return (
    <div className={`product-card ${selected ? 'selected' : ''}`}>
      <div className="product-image-wrapper">
        <img
          src={imgSrc}
          alt={product.name}
          className="product-image"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          loading="lazy"
        />
        {selected && (
          <div className="selected-badge-overlay">
            <Check size={14} /> Selected
          </div>
        )}
      </div>

      <div className="product-details">
        <span className="product-category">{product.category || 'Hair Product'}</span>
        <h3 className="product-title">{product.name}</h3>

        <div className="product-code-price">
          <span className="product-code">Code: {product.product_code}</span>
          {formattedPrice && <span className="product-price">{formattedPrice}</span>}
        </div>

        {mode === 'select' ? (
          <button
            className={`btn-select ${selected ? 'selected' : ''}`}
            onClick={() => toggleStyleSelection(product)}
            type="button"
          >
            {selected ? (
              <>
                <Check size={16} /> Selected
              </>
            ) : (
              <>
                <Plus size={16} /> Select Product
              </>
            )}
          </button>
        ) : mode === 'remove' ? (
          <button
            className="btn-remove"
            onClick={() => removeStyle(product.id)}
            type="button"
          >
            <Trash2 size={16} /> Remove
          </button>
        ) : (
          <Link
            to="/hair-styles"
            className="btn-select"
            style={{ textDecoration: 'none', textAlign: 'center', justifyContent: 'center' }}
          >
            View in Catalogue <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProductCard;

