// src/hooks/useScrollPosition.js
import { useState, useEffect, useCallback } from 'react';

export const useScrollPosition = (threshold = 10) => {
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    const position = window.pageYOffset; // Hoặc window.scrollY
    setIsScrolled(position > threshold);
  }, [threshold]); // Dependency là threshold

  useEffect(() => {
    // Gọi lần đầu để set state ban đầu dựa trên vị trí cuộn hiện tại (quan trọng khi refresh trang)
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]); // Chỉ chạy lại effect nếu hàm handleScroll thay đổi (ít khi, chỉ khi threshold thay đổi)

  return isScrolled;
};