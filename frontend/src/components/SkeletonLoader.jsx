import React from 'react';

const SkeletonLoader = ({ count = 8 }) => {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card">
          <div className="skeleton-img"></div>
          <div className="skeleton-text" style={{ width: '40%' }}></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text short"></div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
