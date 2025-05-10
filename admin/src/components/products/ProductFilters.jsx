import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { useQuery } from '@apollo/client';
import { GET_PRODUCT_OPTIONS_QUERY } from '../../api/queries/productQueries'; // Query lấy options

// Component chứa các bộ lọc cho trang danh sách sản phẩm
function ProductFilters({ initialFilters = {}, onFilterChange, onResetFilters }) {
    const [filters, setFilters] = useState(initialFilters);

    // Fetch options cho dropdowns
    const { data: optionsData } = useQuery(GET_PRODUCT_OPTIONS_QUERY);
    const categories = optionsData?.categories || [];
    const colors = optionsData?.adminGetAllColors || [];
    const collections = optionsData?.adminGetAllCollections || [];

    // Cập nhật state nội bộ khi initialFilters từ bên ngoài thay đổi (ví dụ: reset)
    useEffect(() => {
        setFilters(initialFilters);
    }, [initialFilters]);


    const handleChange = (e) => {
        const { name, value } = e.target;
         const newFilters = { ...filters, [name]: value };
         setFilters(newFilters);
         // Không gọi onFilterChange ở đây nếu có nút Apply riêng
    };

     const handleApplyFilters = () => {
        // Loại bỏ các giá trị rỗng trước khi gửi đi
         const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
             if (value !== '' && value !== null && value !== undefined) {
                 // Chuyển đổi inStock sang boolean nếu cần thiết trước khi gửi
                 if (key === 'inStock') {
                     acc[key] = value === 'true'; // Chuyển thành boolean
                 } else {
                    acc[key] = value;
                 }
             }
             return acc;
         }, {});
        onFilterChange(activeFilters); // Gọi hàm filter của component cha
    };

    const handleReset = () => {
         setFilters({}); // Reset state nội bộ
         onResetFilters(); // Gọi hàm reset của component cha
    }


    return (
        <div className="p-3 mb-3 border rounded bg-light">
            <Row className="g-3 align-items-end">
                {/* Search Term */}
                <Col xs={12} md={6} lg={3}>
                    <Form.Group controlId="filterSearchTerm">
                        <Form.Label>Search</Form.Label>
                        <InputGroup>
                             <Form.Control
                                type="text"
                                placeholder="Product name..."
                                name="searchTerm"
                                value={filters.searchTerm || ''}
                                onChange={handleChange}
                            />
                            {/* --- ĐÃ SỬA LỖI onClick --- */}
                            <Button
                                variant="outline-secondary"
                                onClick={() => {
                                    setFilters(prevFilters => ({ ...prevFilters, searchTerm: '' }));
                                    // Optional: Trigger filter immediately if needed
                                    // const updatedFilters = { ...filters, searchTerm: undefined };
                                    // onFilterChange(updatedFilters);
                                }}
                                title="Clear search"
                            >
                                <i className="bi bi-x-lg"></i>
                            </Button>
                            {/* --- HẾT PHẦN SỬA --- */}
                         </InputGroup>
                    </Form.Group>
                </Col>

                {/* Category */}
                <Col xs={12} md={6} lg={2}>
                    <Form.Group controlId="filterCategory">
                        <Form.Label>Category</Form.Label>
                        <Form.Select name="categoryId" value={filters.categoryId || ''} onChange={handleChange}>
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>

                {/* Collection */}
                 <Col xs={12} md={6} lg={2}>
                    <Form.Group controlId="filterCollection">
                        <Form.Label>Collection</Form.Label>
                        <Form.Select name="collectionId" value={filters.collectionId || ''} onChange={handleChange}>
                            <option value="">All Collections</option>
                            {collections.map(col => (
                                <option key={col.collection_id} value={col.collection_id}>{col.collection_name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>


                {/* Color */}
                <Col xs={12} md={6} lg={2}>
                    <Form.Group controlId="filterColor">
                        <Form.Label>Color</Form.Label>
                        <Form.Select name="colorId" value={filters.colorId || ''} onChange={handleChange}>
                            <option value="">All Colors</option>
                            {colors.map(color => (
                                 <option key={color.color_id} value={color.color_id}>{color.color_name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>

                {/* Stock Status */}
                 <Col xs={12} md={6} lg={2}>
                    <Form.Group controlId="filterStock">
                        <Form.Label>Stock Status</Form.Label>
                        {/* Sử dụng ?? '' để xử lý giá trị boolean/undefined cho select */}
                        <Form.Select name="inStock" value={filters.inStock ?? ''} onChange={handleChange}>
                            <option value="">All</option>
                            <option value="true">In Stock</option>
                            <option value="false">Out of Stock</option>
                        </Form.Select>
                    </Form.Group>
                </Col>


                {/* Action Buttons */}
                <Col xs={12} md={6} lg={1} className="d-flex align-items-end">
                     <div className="d-grid gap-2 d-md-block w-100">
                        <Button variant="primary" onClick={handleApplyFilters} className="me-md-2 mb-2 mb-md-0 w-100">Filter</Button>
                        <Button variant="outline-secondary" onClick={handleReset} className="w-100">Reset</Button>
                     </div>
                </Col>

            </Row>
        </div>
    );
}

export default ProductFilters;