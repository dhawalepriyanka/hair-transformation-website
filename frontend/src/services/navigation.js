export const scrollToPageTop = () => {
  if (typeof window === 'undefined' || typeof window.scrollTo !== 'function') return;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
};
