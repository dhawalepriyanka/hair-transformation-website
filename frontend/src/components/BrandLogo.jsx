import React from 'react';

const BrandLogo = ({ className = '', inverse = false, showText = true }) => (
  <span className={`brand-lockup ${inverse ? 'brand-lockup-inverse' : ''} ${className}`.trim()}>
    <img
      className="brand-emblem"
      src="/brand/dipali-wakale-logo.png"
      alt="Dipali Wakale Hair and Skin Care logo"
    />
    {showText && (
      <span className="brand-copy">
        <strong>Dipali Wakale</strong>
        <small>Hair &amp; Skin Care</small>
      </span>
    )}
  </span>
);

export default BrandLogo;
