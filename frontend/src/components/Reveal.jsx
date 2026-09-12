import React, { useEffect, useRef, useState } from 'react';

const Reveal = ({
  as: Element = 'div',
  children,
  className = '',
  delay = 0,
  variant = 'up',
  style,
  ...props
}) => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -7% 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Element
      ref={elementRef}
      className={`reveal reveal-${variant} ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
      style={{ '--reveal-delay': `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Element>
  );
};

export default Reveal;
