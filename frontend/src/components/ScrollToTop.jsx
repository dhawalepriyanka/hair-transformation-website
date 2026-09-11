import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToPageTop } from '../services/navigation';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToPageTop();
  }, [pathname]);

  return null;
};

export default ScrollToTop;
