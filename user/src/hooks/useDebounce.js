import { useState, useEffect } from 'react';

/**
 * Custom hook để debounce một giá trị.
 * @param {T} value - Giá trị cần debounce.
 * @param {number} delay - Thời gian trễ (ms).
 * @returns {T} Giá trị đã được debounce.
 * @template T
 */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Thiết lập timeout để cập nhật giá trị debounced
    // sau khi `delay` mili giây trôi qua kể từ lần `value` thay đổi cuối cùng.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Hủy timeout nếu `value` thay đổi (nghĩa là người dùng vẫn đang gõ/thay đổi)
    // hoặc nếu `delay` thay đổi, hoặc khi component unmount.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Chỉ chạy lại effect này nếu `value` hoặc `delay` thay đổi.

  return debouncedValue;
}

export default useDebounce;