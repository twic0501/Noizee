import { useState, useEffect, useCallback } from 'react';

// Hàm throttle để hạn chế số lần gọi hàm
const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return function(...args) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

/**
 * Custom hook để theo dõi vị trí cuộn của trang.
 * @param {number} [throttleMilliseconds=100] - Thời gian throttle (ms) để tối ưu hiệu năng.
 * @returns {number} Vị trí cuộn hiện tại (pageYOffset).
 */
const useScrollPosition = (throttleMilliseconds = 100) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  const updatePosition = useCallback(() => {
    setScrollPosition(window.pageYOffset);
  }, []);

  useEffect(() => {
    const throttledUpdatePosition = throttle(updatePosition, throttleMilliseconds);

    window.addEventListener('scroll', throttledUpdatePosition, { passive: true });
    // Gọi một lần để lấy vị trí ban đầu
    throttledUpdatePosition(); 

    return () => {
      window.removeEventListener('scroll', throttledUpdatePosition);
      // Quan trọng: clear timeout nếu có khi component unmount
      // Tuy nhiên, logic throttle hiện tại tự xử lý việc này khi không có event mới.
    };
  }, [updatePosition, throttleMilliseconds]);

  return scrollPosition;
};

export default useScrollPosition;