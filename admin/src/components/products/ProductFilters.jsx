// admin-frontend/src/components/products/ProductFilters.jsx
    import React, { useState, useEffect } from 'react';
    import { Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
    import { useQuery } from '@apollo/client';
    import { GET_PRODUCT_OPTIONS_QUERY } from '../../api/queries/productQueries'; 
    import { ADMIN_LANGUAGE_KEY } from '../../utils/constants';
    import logger from '../../utils/logger';
    
    function ProductFilters({ initialFilters = {}, onFilterChange, onResetFilters }) {
        const [filters, setFilters] = useState(initialFilters);
        const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';
    
        const { data: optionsData, loading: optionsLoading, error: optionsError } = useQuery(GET_PRODUCT_OPTIONS_QUERY, {
            variables: { lang: currentAdminLang },
            onError: (error) => {
                logger.error("ProductFilters: Error fetching product options:", error);
            }
        });
    
        const categories = optionsData?.adminGetAllCategories || [];
        const colors = optionsData?.adminGetAllColors || [];
        const collections = optionsData?.adminGetAllCollections || [];
        const sizes = optionsData?.adminGetAllSizes || [];
    
        useEffect(() => {
            setFilters(initialFilters);
        }, [initialFilters]);
    
        const handleChange = (e) => {
            const { name, value, type, checked } = e.target;
            const newFilters = { ...filters, 
                [name]: type === 'checkbox' ? checked : value 
            };
            setFilters(newFilters);
        };
    
        const handleApplyFilters = () => {
            const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    if (key === 'in_stock') {
                        acc[key] = value === 'true'; 
                    } else if (['category_id', 'collection_id', 'color_id', 'size_id'].includes(key) && value) {
                        acc[key] = String(value); 
                    } else {
                       acc[key] = value;
                    }
                }
                return acc;
            }, {});
            onFilterChange(activeFilters);
        };
    
        const handleReset = () => {
            setFilters({}); 
            onResetFilters(); 
        }
    
        if (optionsError) {
            // Optionally render a more user-friendly error message for options loading
            // For now, just logging, the main product list error will be more prominent.
        }
    
        return (
            <div className="p-3 mb-3 border rounded bg-light">
                <Row className="g-3 align-items-end">
                    <Col xs={12} md={6} lg={3}>
                        <Form.Group controlId="filterSearchTerm">
                            <Form.Label>Tìm kiếm</Form.Label>
                            <InputGroup>
                                 <Form.Control
                                    type="text"
                                    placeholder="Tên sản phẩm..."
                                    name="search_term"
                                    value={filters.search_term || ''}
                                    onChange={handleChange}
                                />
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => {
                                        const newFilters = {...filters, search_term: ''};
                                        setFilters(newFilters);
                                    }}
                                    title="Xóa tìm kiếm"
                                >
                                    <i className="bi bi-x-lg"></i>
                                </Button>
                             </InputGroup>
                        </Form.Group>
                    </Col>
    
                    <Col xs={12} md={6} lg={2}>
                        <Form.Group controlId="filterCategory">
                            <Form.Label>Loại sản phẩm</Form.Label>
                            <Form.Select name="category_id" value={filters.category_id || ''} onChange={handleChange} disabled={optionsLoading}>
                                <option value="">Tất cả loại</option>
                                {categories.map(cat => (
                                    // MODIFIED: Use cat.name directly as it's the localized name from GraphQL
                                    <option key={cat.category_id} value={cat.category_id}>
                                        {cat.name} 
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
    
                     <Col xs={12} md={6} lg={2}>
                        <Form.Group controlId="filterCollection">
                            <Form.Label>Bộ sưu tập</Form.Label>
                            <Form.Select name="collection_id" value={filters.collection_id || ''} onChange={handleChange} disabled={optionsLoading}>
                                <option value="">Tất cả bộ sưu tập</option>
                                {collections.map(col => (
                                    // MODIFIED: Use col.name directly
                                    <option key={col.collection_id} value={col.collection_id}>
                                        {col.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
    
                    <Col xs={12} md={6} lg={2}>
                        <Form.Group controlId="filterColor">
                            <Form.Label>Màu sắc</Form.Label>
                            <Form.Select name="color_id" value={filters.color_id || ''} onChange={handleChange} disabled={optionsLoading}>
                                <option value="">Tất cả màu</option>
                                {colors.map(color => (
                                     // Assuming color.name is already localized or doesn't need it.
                                     // If color.name also comes from a resolver like `name(lang: $lang)`, this is correct.
                                     // Otherwise, if it's just `color.color_name`, that's fine too.
                                     <option key={color.color_id} value={color.color_id}>{color.name || color.color_name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    
                    <Col xs={12} md={6} lg={2}>
                        <Form.Group controlId="filterSize">
                            <Form.Label>Kích thước</Form.Label>
                            <Form.Select name="size_id" value={filters.size_id || ''} onChange={handleChange} disabled={optionsLoading}>
                                <option value="">Tất cả kích thước</option>
                                {sizes.map(size => (
                                     <option key={size.size_id} value={size.size_id}>{size.size_name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
    
                     <Col xs={12} md={6} lg={2}>
                        <Form.Group controlId="filterStock">
                            <Form.Label>Tình trạng kho</Form.Label>
                            <Form.Select name="in_stock" value={filters.in_stock ?? ''} onChange={handleChange}>
                                <option value="">Tất cả</option>
                                <option value="true">Còn hàng</option>
                                <option value="false">Hết hàng</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
    
                    <Col xs={12} md={6} lg={1} className="d-flex align-items-end">
                         <div className="d-grid gap-2 d-md-block w-100">
                            <Button variant="primary" onClick={handleApplyFilters} className="me-md-2 mb-2 mb-md-0 w-100">Lọc</Button>
                            <Button variant="outline-secondary" onClick={handleReset} className="w-100">Reset</Button>
                         </div>
                    </Col>
                </Row>
            </div>
        );
    }
    
    export default ProductFilters;