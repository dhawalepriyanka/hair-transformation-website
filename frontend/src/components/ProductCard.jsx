import React, { useState } from 'react';
import { useSelection } from '../context/SelectionContext';
import { Check, Plus, Trash2 } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800';

const ProductCard = ({ product, mode = 'select' }) => {
  const { isStyleSelected, toggleStyleSelection, removeStyle } = useSelection();
  const selected = isStyleSelected(product.id);
  const [imgSrc, setImgSrc] = useState(product.image_url || FALLBACK_IMAGE);

  const formattedPrice = product.price
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(product.price)
    : null;

  return (
    <div className={`product-card ${selected && mode === 'select' ? 'selected' : ''}`}>
      <div className="product-image-wrapper">
        <img
          src={imgSrc}
          alt={product.name}
          className="product-image"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          loading="lazy"
        />
        {selected && mode === 'select' && (
          <div className="selected-badge-overlay">
            <Check size={14} /> Selected
          </div>
        )}
      </div>

      <div className="product-details">
        <span className="product-category">{product.category || 'Hair Service'}</span>
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
                <Plus size={16} /> Select Style
              </>
            )}
          </button>
        ) : (
          <button
            className="btn-remove"
            onClick={() => removeStyle(product.id)}
            type="button"
          >
            <Trash2 size={16} /> Remove
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
