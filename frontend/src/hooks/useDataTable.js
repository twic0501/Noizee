// src/hooks/useDataTable.js
import { useState, useCallback, useMemo } from 'react';

// Hook cơ bản để quản lý trạng thái bảng (phân trang, sắp xếp, lọc)
const useDataTable = (initialConfig = {}) => {
    const {
        initialLimit = 10,        // Số item mặc định mỗi trang
        initialPage = 1,          // Trang mặc định
        initialSort = { field: null, direction: 'asc' }, // Sắp xếp mặc định
        initialFilters = {}       // Bộ lọc mặc định
    } = initialConfig;

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);
    const [totalItems, setTotalItems] = useState(0); // Tổng số item (cập nhật từ API response)
    const [sorting, setSorting] = useState(initialSort);
    const [filters, setFilters] = useState(initialFilters);

    // Hàm xử lý chuyển trang
    const handlePageChange = useCallback((newPage) => {
        // Đảm bảo newPage hợp lệ (nếu cần kiểm tra totalPages ở đây)
         if (newPage >= 1) {
            setCurrentPage(newPage);
        }
        // Component sử dụng hook sẽ gọi refetch với offset mới
    }, []);

    // Hàm xử lý thay đổi limit (số item mỗi trang)
    const handleLimitChange = useCallback((newLimit) => {
        const parsedLimit = parseInt(newLimit, 10) || initialLimit;
        setLimit(parsedLimit);
        setCurrentPage(1); // Reset về trang 1 khi đổi limit
        // Component sử dụng hook sẽ gọi refetch
    }, [initialLimit]);

    // Hàm xử lý sắp xếp
    const handleSort = useCallback((field) => {
        setSorting(prev => ({
            field,
            // Đảo chiều sắp xếp nếu click lại vào cột cũ, nếu không thì mặc định 'asc'
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
        setCurrentPage(1); // Reset về trang 1 khi sort
         // Component sử dụng hook sẽ gọi refetch với biến sort mới
    }, []);

    // Hàm xử lý thay đổi filter (cập nhật toàn bộ object filter)
    // Thường được gọi từ component Filter tổng hợp
    const setFiltersCallback = useCallback((newFilters) => {
         // Loại bỏ các key có giá trị rỗng hoặc undefined trước khi set
         const activeFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
             if (value !== '' && value !== null && value !== undefined) {
                 acc[key] = value;
             }
             return acc;
         }, {});
        setFilters(activeFilters);
        setCurrentPage(1); // Reset về trang 1 khi filter
         // Component sử dụng hook sẽ gọi refetch với biến filter mới
    }, []);


    // Hàm reset filter về rỗng
    const resetFilters = useCallback(() => {
        setFilters({});
        setCurrentPage(1);
         // Component sử dụng hook sẽ gọi refetch với filter rỗng
    }, []);

    // Tính toán offset dựa trên trang hiện tại và limit
    const offset = useMemo(() => (currentPage - 1) * limit, [currentPage, limit]);

    // Tính tổng số trang
    const totalPages = useMemo(() => Math.ceil(totalItems / limit), [totalItems, limit]);

    return {
        // State
        currentPage,
        limit,
        totalItems,
        totalPages,
        sorting,
        filters,
        // Giá trị tính toán
        offset, // Dùng cho biến GraphQL query
        // Hàm xử lý
        handlePageChange,
        handleLimitChange,
        handleSort,
        setFilters: setFiltersCallback, // Đổi tên để rõ ràng hơn là cập nhật cả object filter
        resetFilters,
        setTotalItems, // Hàm để component cha cập nhật tổng số item sau khi fetch
    };
};

export default useDataTable;