import React from 'react';

const BrandLogo = ({ className = '', inverse = false, showText = true }) => (
  <span className={`brand-lockup ${inverse ? 'brand-lockup-inverse' : ''} ${className}`.trim()}>
    <img
      className="brand-emblem"
      src="/brand/dipali-wakale-logo.jpg"
      alt="DplNuria Divine Aura - Hair Skin Beauty logo"
    />
    {showText && (
      <span className="brand-copy">
        <strong>DplNuria</strong>
        <small>Divine Aura</small>
      </span>
    )}
  </span>
);

export default BrandLogo;
