// src/hooks/useScrollPosition.js
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
  const [scrollPosition, setScrollPosition] = useState(window.pageYOffset); // Lấy giá trị ban đầu trực tiếp

  const updatePosition = useCallback(() => {
    setScrollPosition(window.pageYOffset);
  }, []); // Mảng phụ thuộc rỗng vì window và pageYOffset là global

  useEffect(() => {
    const throttledUpdatePosition = throttle(updatePosition, throttleMilliseconds);

    window.addEventListener('scroll', throttledUpdatePosition, { passive: true });
    // Không cần gọi throttledUpdatePosition() ở đây nữa vì giá trị scroll ban đầu đã được set

    return () => {
      window.removeEventListener('scroll', throttledUpdatePosition);
      // Nếu hàm throttle của bạn có cơ chế clear (ví dụ trả về hàm clear),
      // bạn có thể cần gọi nó ở đây, nhưng với triển khai hiện tại thì không cần thiết.
    };
  }, [updatePosition, throttleMilliseconds]); // updatePosition ổn định do useCallback

  return scrollPosition;
};

export default useScrollPosition;