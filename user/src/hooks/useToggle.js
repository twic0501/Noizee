import { useState, useCallback } from 'react';

/**
 * Custom hook để quản lý một trạng thái boolean (toggle).
 * @param {boolean} [initialState=false] - Giá trị boolean khởi tạo.
 * @returns {[boolean, () => void, React.Dispatch<React.SetStateAction<boolean>>]} Một mảng chứa:
 * - `state`: Giá trị boolean hiện tại.
 * - `toggle`: Hàm để đảo ngược trạng thái.
 * - `setState`: Hàm để set trạng thái một cách trực tiếp (tùy chọn).
 */
const useToggle = (initialState = false) => {
  const [state, setState] = useState(initialState);

  // Hàm toggle được memoized bằng useCallback để tránh tạo lại không cần thiết,
  // hữu ích nếu hàm này được truyền làm prop cho các component con được memoized.
  const toggle = useCallback(() => {
    setState(prevState => !prevState);
  }, []);

  return [state, toggle, setState]; // Trả về cả setState để linh hoạt hơn
};

export default useToggle;