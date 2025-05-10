import { useState, useEffect, useCallback } from 'react';

export const useScrollPosition = (threshold = 10) => {
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    const position = window.pageYOffset;
    setIsScrolled(position > threshold);
  }, [threshold]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Gọi lần đầu để set state ban đầu
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]); // Chỉ chạy lại effect nếu handleScroll thay đổi (ít khi)

  return isScrolled;
};