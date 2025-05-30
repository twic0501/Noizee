// src/components/product/ProductFilterEnhanced.jsx
import React, { useState, useEffect, useRef } from 'react';
// import { Plus } from 'lucide-react'; // Thay thế bằng icon từ react-bootstrap-icons nếu cần
import { PlusLg } from 'react-bootstrap-icons'; // Ví dụ

// GSAP (đảm bảo đã import và đăng ký plugin ở file chính)
// import { gsap } from 'gsap'; // Nếu import trực tiếp
// Hoặc truy cập qua window.gsap nếu đã load global

const ProductFilterEnhanced = ({
    isOpen,
    onClose,
    onApplyFilters,
    onClearFilters, // Thêm prop này để xử lý việc xóa bộ lọc
    availableCategories = [],
    availableColors = [],
    availableSizes = [],
    initialFilters, // Các filter đã được áp dụng trước đó
    // loadingOptions // Nếu cần hiển thị trạng thái loading cho các tùy chọn filter
}) => {
    const [isInStock, setIsInStock] = useState(initialFilters?.inStock ?? true);
    const [selectedCategories, setSelectedCategories] = useState(initialFilters?.categories ?? []);
    const [selectedColors, setSelectedColors] = useState(initialFilters?.colors ?? []);
    const [selectedSizes, setSelectedSizes] = useState(initialFilters?.sizes ?? []);

    const initialCategoryShowCount = 5;
    const initialColorShowCount = 5;
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [showAllColors, setShowAllColors] = useState(false);
    const filterPanelRef = useRef(null);

    // Cập nhật state nội bộ khi initialFilters thay đổi (ví dụ, khi URL params thay đổi từ bên ngoài)
    useEffect(() => {
        setIsInStock(initialFilters?.inStock ?? true);
        setSelectedCategories(initialFilters?.categories ?? []);
        setSelectedColors(initialFilters?.colors ?? []);
        setSelectedSizes(initialFilters?.sizes ?? []);
    }, [initialFilters]);


    useEffect(() => {
        if (!filterPanelRef.current || typeof window.gsap === 'undefined') return;
        const panel = filterPanelRef.current;

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.gsap.to(panel, { x: 0, duration: 0.3, ease: "power2.out", onStart: () => {
                if (filterPanelRef.current) filterPanelRef.current.style.visibility = 'visible';
            }});
        } else {
            document.body.style.overflow = '';
            if (panel.style.transform === 'translateX(0px)' || panel.style.transform === '') {
                 window.gsap.to(panel, { x: "100%", duration: 0.3, ease: "power2.in", onComplete: () => {
                    if (filterPanelRef.current) filterPanelRef.current.style.visibility = 'hidden';
                 }});
            } else if (!isOpen && panel.style.transform === '') { // Trạng thái ẩn ban đầu
                 window.gsap.set(panel, { x: "100%", visibility: 'hidden' });
            }
        }
    }, [isOpen]);

    const handleCategoryChange = (categoryId) => {
        setSelectedCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleColorChange = (colorId) => {
        setSelectedColors((prev) =>
            prev.includes(colorId)
                ? prev.filter((id) => id !== colorId)
                : [...prev, colorId]
        );
    };

    const handleSizeChange = (sizeId) => {
        setSelectedSizes((prev) =>
            prev.includes(sizeId)
                ? prev.filter((id) => id !== sizeId)
                : [...prev, sizeId]
        );
    };

    const handleApplyInternal = () => {
        const filters = {
            inStock: isInStock,
            categories: selectedCategories,
            colors: selectedColors,
            sizes: selectedSizes,
        };
        if (onApplyFilters) onApplyFilters(filters);
        if (onClose) onClose();
    };

    const handleClearInternal = () => {
        setIsInStock(true);
        setSelectedCategories([]);
        setSelectedColors([]);
        setSelectedSizes([]);
        if (onClearFilters) { // Gọi hàm onClearFilters từ props
            onClearFilters(); // Hàm này sẽ chịu trách nhiệm cập nhật URL params và state ở ProductListingPage
        }
        // Không cần gọi onApplyFilters ở đây nữa nếu onClearFilters đã xử lý việc áp dụng filter rỗng
        if (onClose) onClose();
    };


    const visibleCategories = showAllCategories ? availableCategories : availableCategories.slice(0, initialCategoryShowCount);
    const visibleColors = showAllColors ? availableColors : availableColors.slice(0, initialColorShowCount);

    // Điều kiện render: Luôn render component để GSAP có thể truy cập ref
    // Visibility sẽ được kiểm soát bởi GSAP và style inline

    return (
        <>
            {isOpen && <div className="offcanvas-backdrop fade show" onClick={onClose} style={{zIndex: 1040}}></div>}
            <div
                ref={filterPanelRef}
                className="offcanvas offcanvas-end bg-dark text-light shadow-lg" // Sử dụng màu nền tối và chữ sáng
                tabIndex="-1"
                id="productFilterOffcanvas"
                aria-labelledby="productFilterOffcanvasLabel"
                style={{
                    transform: 'translateX(100%)', // Trạng thái ẩn ban đầu
                    visibility: 'hidden', // Ẩn ban đầu
                    width: '320px', // Độ rộng panel
                    zIndex: 1045
                }}
            >
                <div className="offcanvas-header border-bottom border-secondary p-3">
                    <h5 className="offcanvas-title text-uppercase small" id="productFilterOffcanvasLabel">Filter</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                </div>

                <div className="offcanvas-body p-3 small" style={{fontSize: '0.8rem'}}>
                    {/* In Stock Switch */}
                    <div className="mb-3">
                        <div className="form-check form-switch d-flex justify-content-between align-items-center py-1">
                            <label className="form-check-label text-uppercase" htmlFor="inStockSwitchFilter">
                                Tất cả sản phẩm
                            </label>
                            <div>
                                <span className="me-2 text-muted" style={{fontSize: '0.7rem'}}>CHỈ HIỂN THỊ CÒN HÀNG</span>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="inStockSwitchFilter"
                                    checked={isInStock}
                                    onChange={() => setIsInStock(!isInStock)}
                                />
                            </div>
                        </div>
                    </div>
                    <hr className="border-secondary my-2" />

                    {/* Categories Filter */}
                    {availableCategories && availableCategories.length > 0 && (
                        <div className="mb-3">
                            <h6 className="text-uppercase small text-muted mb-2">Danh mục</h6>
                            {visibleCategories.map((category) => (
                                <div className="form-check mb-1" key={category.category_id || category.id}>
                                    <input
                                        className="form-check-input bg-dark border-secondary" // Style cho dark theme
                                        type="checkbox"
                                        value={category.category_id || category.id}
                                        id={`filter-cat-${category.category_id || category.id}`}
                                        checked={selectedCategories.includes(category.category_id || category.id)}
                                        onChange={() => handleCategoryChange(category.category_id || category.id)}
                                    />
                                    <label className="form-check-label" htmlFor={`filter-cat-${category.category_id || category.id}`}>
                                        {category.name}
                                    </label>
                                </div>
                            ))}
                            {availableCategories.length > initialCategoryShowCount && (
                                <button onClick={() => setShowAllCategories(!showAllCategories)} className="btn btn-link btn-sm text-light p-0 mt-1 small text-decoration-none">
                                    <PlusLg size={12} className="me-1" /> {showAllCategories ? 'Ẩn bớt' : `Xem thêm ${availableCategories.length - initialCategoryShowCount}`}
                                </button>
                            )}
                        </div>
                    )}
                    <hr className="border-secondary my-2" />

                    {/* Colors Filter */}
                    {availableColors && availableColors.length > 0 && (
                        <div className="mb-3">
                            <h6 className="text-uppercase small text-muted mb-2">Màu sắc</h6>
                            {visibleColors.map((color) => (
                                <div className="form-check mb-1 d-flex align-items-center" key={color.color_id || color.id}>
                                    <input
                                        className="form-check-input d-none" // Ẩn checkbox gốc
                                        type="checkbox"
                                        value={color.color_id || color.id}
                                        id={`filter-color-${color.color_id || color.id}`}
                                        checked={selectedColors.includes(color.color_id || color.id)}
                                        onChange={() => handleColorChange(color.color_id || color.id)}
                                    />
                                    <label
                                        className="form-check-label d-flex align-items-center"
                                        htmlFor={`filter-color-${color.color_id || color.id}`}
                                        style={{cursor: 'pointer'}}
                                    >
                                        <span
                                            className={`d-inline-block rounded-circle me-2 border ${selectedColors.includes(color.color_id || color.id) ? 'border-light ring-1 ring-light' : 'border-secondary'}`}
                                            style={{ width: '18px', height: '18px', backgroundColor: color.color_hex }}
                                            title={color.name}
                                        ></span>
                                        {color.name}
                                    </label>
                                </div>
                            ))}
                            {availableColors.length > initialColorShowCount && (
                                <button onClick={() => setShowAllColors(!showAllColors)} className="btn btn-link btn-sm text-light p-0 mt-1 small text-decoration-none">
                                    <PlusLg size={12} className="me-1" /> {showAllColors ? 'Ẩn bớt' : `Xem thêm ${availableColors.length - initialColorShowCount}`}
                                </button>
                            )}
                        </div>
                    )}
                    <hr className="border-secondary my-2" />

                    {/* Sizes Filter */}
                    {availableSizes && availableSizes.length > 0 && (
                        <div>
                            <h6 className="text-uppercase small text-muted mb-2">Kích thước</h6>
                            <div className="d-flex flex-wrap gap-1">
                                {availableSizes.map((size) => (
                                    <button
                                        key={size.size_id || size.id}
                                        onClick={() => handleSizeChange(size.size_id || size.id)}
                                        className={`btn btn-sm ${selectedSizes.includes(size.size_id || size.id) ? 'btn-light text-dark' : 'btn-outline-secondary text-light'}`}
                                    >
                                        {size.size_name || size.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="offcanvas-footer p-3 border-top border-secondary">
                    <button onClick={handleApplyInternal} className="btn btn-light w-100 mb-2 btn-sm text-uppercase">
                        Xem sản phẩm
                    </button>
                    <button onClick={handleClearInternal} className="btn btn-outline-secondary w-100 btn-sm text-uppercase">
                        Xóa bộ lọc
                    </button>
                </div>
            </div>
        </>
    );
};

export default ProductFilterEnhanced;
