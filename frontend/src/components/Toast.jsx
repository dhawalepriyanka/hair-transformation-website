import React, { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 4500 }) {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => closeRef.current?.(), duration);
    return () => window.clearTimeout(timer);
  }, [message, duration]);

  if (!message) return null;

  const isError = type === 'error';
  return (
    <div
      className={`app-toast app-toast-${isError ? 'error' : 'success'}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className="app-toast-icon">
        {isError ? <AlertCircle /> : <CheckCircle2 />}
      </span>
      <div className="app-toast-copy">
        <strong>{isError ? 'Please check' : 'Success'}</strong>
        <span>{message}</span>
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss notification"><X /></button>
      <i className="app-toast-progress" style={{ '--toast-duration': `${duration}ms` }} />
    </div>
  );
}
