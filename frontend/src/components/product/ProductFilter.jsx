// src/components/products/ProductFilter.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Accordion } from 'react-bootstrap';
import { useQuery } from '@apollo/client';
import { GET_FILTER_OPTIONS_QUERY } from '../../api/graphql/queries/productQueries';
import './ProductFilter.css'; // CSS riêng cho filter

function ProductFilter({ initialFilters = {}, onFilterChange }) {
  const [filters, setFilters] = useState(initialFilters);

  // Fetch options cho filter
  const { data: optionsData, loading: optionsLoading } = useQuery(GET_FILTER_OPTIONS_QUERY);
  const categories = optionsData?.categories || [];
  const sizes = optionsData?.sizes || [];
  const colors = optionsData?.availableColors || []; // Dùng alias từ query

  useEffect(() => {
    setFilters(initialFilters); // Đồng bộ filter từ bên ngoài
  }, [initialFilters]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Xử lý checkbox (nếu có filter dạng checkbox)
    if (type === 'checkbox') {
        // TODO: Logic thêm/bớt giá trị vào mảng filter (ví dụ: size, color)
        console.warn("Checkbox filter logic not fully implemented yet.");
        setFilters(prev => ({ ...prev, [name]: checked })); // Tạm thời gán boolean
    } else {
        setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

   // Gọi onFilterChange khi state filters thay đổi (debounced hoặc khi nhấn nút)
   useEffect(() => {
       // Debounce để tránh gọi API liên tục khi gõ nhanh
       const handler = setTimeout(() => {
           const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
               if (value !== '' && value !== null && value !== undefined) {
                   acc[key] = value;
               }
               return acc;
           }, {});
            // Chỉ gọi nếu filter thực sự thay đổi so với initialFilters (tùy chọn)
           if (JSON.stringify(activeFilters) !== JSON.stringify(initialFilters)) {
               onFilterChange(activeFilters);
           }
       }, 500); // Delay 500ms

       return () => {
           clearTimeout(handler);
       };
   }, [filters, onFilterChange, initialFilters]);


  const handleReset = () => {
    setFilters({}); // Reset state nội bộ
    onFilterChange({}); // Gửi filter rỗng lên component cha
  };

  return (
    <div className="product-filter-sidebar mb-4"> {/* CSS */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="filter-title mb-0">Filter By</h5> {/* CSS: Oswald */}
        <Button variant="link" size="sm" onClick={handleReset} className="text-muted">Reset All</Button>
      </div>

      {/* Sử dụng Accordion của Bootstrap để nhóm filter */}
      <Accordion defaultActiveKey={['0','1']} alwaysOpen flush>
        {/* Category Filter */}
        <Accordion.Item eventKey="0">
          <Accordion.Header>Category</Accordion.Header> {/* CSS: Oswald */}
          <Accordion.Body>
            <Form.Select name="categoryId" value={filters.categoryId || ''} onChange={handleChange} size="sm">
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
              ))}
            </Form.Select>
          </Accordion.Body>
        </Accordion.Item>

        {/* Size Filter (Ví dụ dùng Radio hoặc Checkbox) */}
        <Accordion.Item eventKey="1">
          <Accordion.Header>Size</Accordion.Header> {/* CSS: Oswald */}
          <Accordion.Body>
            {optionsLoading ? <small>Loading sizes...</small> : (
                sizes.map(size => (
                    <Form.Check
                        key={size.size_id}
                        type="radio" // Hoặc 'checkbox' nếu cho chọn nhiều
                        id={`size-${size.size_id}`}
                        label={size.size_name}
                        name="sizeId" // Phải khớp với key trong state `filters`
                        value={size.size_id}
                        checked={String(filters.sizeId) === String(size.size_id)} // So sánh chuỗi
                        onChange={handleChange}
                        className="mb-1 filter-option" /* CSS */
                    />
                ))
            )}
             </Accordion.Body>
        </Accordion.Item>

         {/* Color Filter (Ví dụ dùng Swatch) */}
         <Accordion.Item eventKey="2">
           <Accordion.Header>Color</Accordion.Header> {/* CSS: Oswald */}
           <Accordion.Body className="color-filter-body"> {/* CSS: Dùng flexbox để wrap */}
             {optionsLoading ? <small>Loading colors...</small> : (
                 colors.map(color => (
                     <div
                         key={color.color_id}
                         className={`color-swatch ${String(filters.colorId) === String(color.color_id) ? 'selected' : ''}`} /* CSS */
                         style={{ backgroundColor: color.color_hex || '#ccc' }}
                         title={color.color_name}
                         onClick={() => handleChange({ target: { name: 'colorId', value: color.color_id } })} // Giả lập event
                     ></div>
                 ))
             )}
            </Accordion.Body>
         </Accordion.Item>

         {/* Price Range Filter */}
         <Accordion.Item eventKey="3">
            <Accordion.Header>Price</Accordion.Header> {/* CSS: Oswald */}
            <Accordion.Body>
                 {/* TODO: Implement Price Range Slider hoặc Input */}
                 <Form.Group className="mb-2">
                     <Form.Label><small>Min Price</small></Form.Label>
                     <Form.Control size="sm" type="number" name="minPrice" value={filters.minPrice || ''} onChange={handleChange} placeholder="e.g., 100000"/>
                 </Form.Group>
                 <Form.Group>
                     <Form.Label><small>Max Price</small></Form.Label>
                     <Form.Control size="sm" type="number" name="maxPrice" value={filters.maxPrice || ''} onChange={handleChange} placeholder="e.g., 500000"/>
                 </Form.Group>
             </Accordion.Body>
         </Accordion.Item>

      </Accordion>
    </div>
  );
}

export default ProductFilter;