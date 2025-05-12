// src/hooks/useDataTable.js
import { useState, useCallback, useMemo } from 'react';

const useDataTable = (initialConfig = {}) => {
  const {
    initialLimit = 10,
    initialPage = 1,
    initialSort = { field: null, direction: 'asc' }, // Ví dụ: { field: 'name', direction: 'asc' }
    initialFilters = {}, // Ví dụ: { categoryId: '1', inStock: true }
  } = initialConfig;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0); // Tổng số item từ API
  const [sorting, setSorting] = useState(initialSort);
  const [filters, setFiltersState] = useState(initialFilters); // Đổi tên để tránh trùng với prop

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1) {
      setCurrentPage(newPage);
    }
  }, []);

  const handleLimitChange = useCallback((newLimit) => {
    const parsedLimit = parseInt(newLimit, 10) || initialLimit;
    setLimit(parsedLimit);
    setCurrentPage(1); // Reset về trang 1 khi đổi limit
  }, [initialLimit]);

  const handleSort = useCallback((field) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1); // Reset về trang 1 khi sort
  }, []);

  // Hàm này nhận toàn bộ object filter mới
  const applyFilters = useCallback((newFilters) => {
    // Loại bỏ các key có giá trị rỗng, null, hoặc undefined
    const activeFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
    setFiltersState(activeFilters);
    setCurrentPage(1); // Reset về trang 1 khi áp dụng filter
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({});
    setCurrentPage(1);
  }, []);

  const offset = useMemo(() => (currentPage - 1) * limit, [currentPage, limit]);
  const totalPages = useMemo(() => Math.ceil(totalItems / limit), [totalItems, limit]);

  return {
    // States and derived values
    currentPage,
    limit,
    totalItems,
    totalPages,
    sorting,
    filters, // Đây là object filter đã được làm sạch
    offset,

    // Setters and handlers
    handlePageChange,
    handleLimitChange,
    handleSort,
    applyFilters, // Hàm để component cha áp dụng bộ filter mới
    resetFilters,
    setTotalItems, // Để component cha cập nhật tổng số item sau khi fetch
    setLimit, // Cho phép đặt lại limit từ bên ngoài nếu cần
    setCurrentPage, // Cho phép đặt lại page từ bên ngoài nếu cần
  };
};

export default useDataTable;