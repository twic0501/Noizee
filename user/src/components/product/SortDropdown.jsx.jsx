// src/components/product/SortDropdown.jsx
import React, { useState, useEffect } from 'react';

// Giả sử initialSortOptions được truyền vào hoặc định nghĩa ở đây
// Ví dụ:
// const initialSortOptions = [
//     { id: 'featured', label: 'Nổi bật' },
//     { id: 'price_asc', label: 'Giá: Thấp đến Cao' },
//     { id: 'price_desc', label: 'Giá: Cao đến Thấp' },
//     { id: 'created_at_desc', label: 'Mới nhất' },
//     { id: 'name_asc', label: 'Tên: A-Z' },
// ];

const SortDropdown = ({
    onSortChange, // (sortByValue, sortOrderValue) => void
    onPriceRangeChange, // ({ min, max }) => void // Đổi tên từ onPriceChange để rõ ràng hơn
    initialSortBy = 'featured', // Giá trị sắp xếp ban đầu (ví dụ: 'featured', 'price_asc')
    initialSortOrder = 'DESC', // Thêm initialSortOrder
    initialPriceRange = { min: 0, max: 5000000 }, // Khoảng giá ban đầu
    availableSortOptions = [ // Cung cấp giá trị mặc định nếu không được truyền
        { id: 'featured', label: 'Nổi bật', sortBy: 'popularity', sortOrder: 'DESC' }, // Thêm sortBy và sortOrder
        { id: 'newest', label: 'Mới nhất', sortBy: 'createdAt', sortOrder: 'DESC' },
        { id: 'price_asc', label: 'Giá: Thấp đến Cao', sortBy: 'price', sortOrder: 'ASC' },
        { id: 'price_desc', label: 'Giá: Cao đến Thấp', sortBy: 'price', sortOrder: 'DESC' },
    ]
}) => {
    const [selectedSortOptionId, setSelectedSortOptionId] = useState(initialSortBy === 'popularity' && initialSortOrder === 'DESC' ? 'featured' : initialSortBy);
    const [currentMaxPrice, setCurrentMaxPrice] = useState(initialPriceRange.max);
    const [searchTerm, setSearchTerm] = useState(''); // Cho việc lọc các tùy chọn sắp xếp

    const minPriceLimit = 0; // Giới hạn giá tối thiểu
    const maxPriceLimit = 10000000; // Giới hạn giá tối đa cho thanh trượt

    useEffect(() => {
        // Cập nhật state nội bộ nếu props initial thay đổi
        const currentSelectedOption = availableSortOptions.find(opt => opt.sortBy === initialSortBy && opt.sortOrder === initialSortOrder);
        setSelectedSortOptionId(currentSelectedOption ? currentSelectedOption.id : (initialSortBy === 'popularity' ? 'featured' : initialSortBy));
        setCurrentMaxPrice(initialPriceRange.max);
    }, [initialSortBy, initialSortOrder, initialPriceRange.max, availableSortOptions]);


    const handleSortSelect = (option) => {
        setSelectedSortOptionId(option.id);
        if (onSortChange) {
            onSortChange(option.sortBy, option.sortOrder); // Truyền cả sortBy và sortOrder
        }
        // Đóng dropdown (Bootstrap sẽ tự xử lý nếu dùng đúng cấu trúc)
    };

    const handlePriceSliderChange = (event) => {
        const newMaxPrice = parseInt(event.target.value, 10);
        setCurrentMaxPrice(newMaxPrice);
        // Không gọi onPriceRangeChange ở đây ngay, chỉ gọi khi người dùng thả chuột hoặc nhấn Apply
    };

    const handlePriceApply = () => {
        // Hàm này có thể được gọi bởi một nút "Apply Price" hoặc khi dropdown đóng
        if (onPriceRangeChange) {
            onPriceRangeChange({ min: minPriceLimit, max: currentMaxPrice });
        }
    };

    const filteredSortOptions = availableSortOptions.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getSelectedLabel = () => {
        return availableSortOptions.find(opt => opt.id === selectedSortOptionId)?.label || 'Sắp xếp theo';
    };

    return (
        <div className="dropdown">
            <button
                className="btn btn-outline-dark btn-sm dropdown-toggle text-uppercase small"
                type="button"
                id="sortDropdownMenuButton"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ minWidth: '180px' }} // Giữ lại minWidth nếu cần
            >
                {getSelectedLabel()}
            </button>
            <div
                className="dropdown-menu dropdown-menu-end p-3 shadow border-0" // Thêm border-0
                aria-labelledby="sortDropdownMenuButton"
                style={{ width: '280px' }} // Giữ lại width nếu cần
            >
                {/* Search input for sort options (optional) */}
                {/* <input
                    type="text"
                    placeholder="Lọc tùy chọn..."
                    className="form-control form-control-sm mb-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                /> */}

                {filteredSortOptions.map(option => (
                    <button
                        key={option.id}
                        onClick={() => handleSortSelect(option)}
                        className={`dropdown-item small rounded-1 ${selectedSortOptionId === option.id ? 'active bg-dark text-white' : 'text-dark'}`}
                        // Thêm style cho hover state nếu cần, Bootstrap đã có sẵn
                    >
                        {option.label}
                    </button>
                ))}

                {onPriceRangeChange && ( // Chỉ hiển thị phần giá nếu có hàm xử lý
                    <>
                        <hr className="my-2" />
                        <div className="px-1"> {/* Giảm padding của px-2 thành px-1 */}
                            <label htmlFor="price-slider-sort" className="form-label small mb-1 text-muted">
                                Giá tối đa: {currentMaxPrice.toLocaleString()}đ
                            </label>
                            <input
                                type="range"
                                id="price-slider-sort"
                                min={minPriceLimit}
                                max={maxPriceLimit}
                                value={currentMaxPrice}
                                onChange={handlePriceSliderChange}
                                onMouseUp={handlePriceApply} // Gọi khi thả chuột
                                onTouchEnd={handlePriceApply} // Gọi khi thả tay trên touch screen
                                className="form-range"
                            />
                            <div className="d-flex justify-content-between small text-muted mt-1" style={{fontSize: '0.7rem'}}>
                                <span>{minPriceLimit.toLocaleString()}đ</span>
                                <span>{maxPriceLimit.toLocaleString()}đ</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SortDropdown;
