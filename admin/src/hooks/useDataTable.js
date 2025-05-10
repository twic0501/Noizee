// src/hooks/useDataTable.js
import { useState, useCallback, useMemo } from 'react';

const useDataTable = (initialConfig = {}) => {
    const {
        initialLimit = 10,
        initialPage = 1,
        initialSort = { field: null, direction: 'asc' }, // field: null nghĩa là không sort ban đầu
        initialFilters = {}
    } = initialConfig;

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);
    const [totalItems, setTotalItems] = useState(0); // Tổng số item từ API
    const [sorting, setSorting] = useState(initialSort);
    const [filters, setFilters] = useState(initialFilters);

    const handlePageChange = useCallback((newPage) => {
        // Component sử dụng hook sẽ kiểm tra newPage có hợp lệ không dựa trên totalPages
        setCurrentPage(newPage);
    }, []);

    const handleLimitChange = useCallback((newLimit) => {
        const parsedLimit = parseInt(newLimit, 10);
        if (parsedLimit > 0 && parsedLimit !== limit) {
            setLimit(parsedLimit);
            setCurrentPage(1); // Reset về trang 1 khi đổi limit
        }
    }, [limit]);

    const handleSort = useCallback((fieldToSort) => {
        setSorting(prev => {
            const isAsc = prev.field === fieldToSort && prev.direction === 'asc';
            return {
                field: fieldToSort,
                direction: isAsc ? 'desc' : 'asc',
            };
        });
        setCurrentPage(1); // Reset về trang 1 khi sort
    }, []);

    // Hàm này nhận toàn bộ object filters mới
    const applyFilters = useCallback((newFilters) => {
        // Chỉ set những filter có giá trị (không phải rỗng, null, undefined)
        const activeFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});

        if (JSON.stringify(filters) !== JSON.stringify(activeFilters)) { // Chỉ cập nhật nếu filter thực sự thay đổi
            setFilters(activeFilters);
            setCurrentPage(1); // Reset về trang 1
        }
    }, [filters]); // Thêm filters vào dependency

    const resetFilters = useCallback(() => {
        if (Object.keys(filters).length > 0) { // Chỉ reset nếu có filter đang được áp dụng
            setFilters({});
            setCurrentPage(1);
        }
    }, [filters]); // Thêm filters vào dependency

    const offset = useMemo(() => (currentPage - 1) * limit, [currentPage, limit]);
    const totalPages = useMemo(() => totalItems > 0 ? Math.ceil(totalItems / limit) : 1, [totalItems, limit]);

    return {
        currentPage,
        limit,
        totalItems,
        totalPages,
        sorting,
        filters,
        offset,
        handlePageChange,
        handleLimitChange,
        handleSort,
        applyFilters, // Đổi tên từ setFilters để rõ ràng hơn
        resetFilters,
        setTotalItems, // Hàm này rất quan trọng để component cha cập nhật sau khi fetch API
    };
};

export default useDataTable;