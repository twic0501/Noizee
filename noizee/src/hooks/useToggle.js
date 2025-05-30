import { useState, useCallback } from 'react';

const useToggle = (initialState = false) => {
    const [state, setState] = useState(initialState);
    const toggle = useCallback(() => setState(s => !s), []);
    return [state, toggle, setState]; // Trả về cả setState nếu cần set giá trị cụ thể
};

export default useToggle;