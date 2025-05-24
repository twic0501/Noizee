// src/utils/helpers.js

// Ví dụ: Hàm tạo ID duy nhất đơn giản (chỉ cho mục đích demo, không nên dùng cho production ID)
export const simpleUniqueId = () => {
  return Math.random().toString(36).substring(2, 9);
};

// Ví dụ: Hàm debounce (trì hoãn việc thực thi một hàm)
// Rất hữu ích cho việc xử lý input search hoặc filter để tránh gọi API liên tục
export function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Ví dụ: Hàm cuộn lên đầu trang
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth', // Cuộn mượt
  });
};