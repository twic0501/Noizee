// src/components/product/ProductFilter.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Accordion, Spinner,Row ,Col} from 'react-bootstrap'; // Thêm Spinner
import { useQuery } from '@apollo/client';
import { GET_FILTER_OPTIONS_QUERY } from '../../api/graphql/queries/productQueries';
import './ProductFilter.css'; // CSS riêng cho filter

function ProductFilter({ initialFilters = {}, onFilterChange, isLoadingExternally = false }) {
  const [filters, setFilters] = useState(initialFilters);
  const [priceRange, setPriceRange] = useState({ min: initialFilters.minPrice || '', max: initialFilters.maxPrice || '' });

  // Fetch options cho filter
  const { data: optionsData, loading: optionsLoading, error: optionsError } = useQuery(GET_FILTER_OPTIONS_QUERY);

  const categories = optionsData?.categories || [];
  const sizes = optionsData?.sizes || [];
  const colors = optionsData?.availableColors || []; // Dùng alias từ query

  // Đồng bộ filter từ bên ngoài (ví dụ: từ URL)
  useEffect(() => {
    setFilters(initialFilters);
    setPriceRange({ min: initialFilters.minPrice || '', max: initialFilters.maxPrice || '' });
  }, [initialFilters]);

  const handleFilterItemChange = useCallback((name, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === '' || value === null || value === undefined) {
        delete newFilters[name];
      } else {
        newFilters[name] = value;
      }
      // Gọi onFilterChange ngay khi một lựa chọn thay đổi (ngoại trừ price)
      if (name !== 'minPrice' && name !== 'maxPrice') {
        onFilterChange(newFilters);
      }
      return newFilters;
    });
  }, [onFilterChange]);

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({ ...prev, [name]: value }));
  };

  const applyPriceFilter = useCallback(() => {
    const newFilters = { ...filters };
    if (priceRange.min) newFilters.minPrice = parseFloat(priceRange.min); else delete newFilters.minPrice;
    if (priceRange.max) newFilters.maxPrice = parseFloat(priceRange.max); else delete newFilters.maxPrice;
    onFilterChange(newFilters);
  }, [filters, priceRange, onFilterChange]);

  // Debounce việc áp dụng filter giá khi người dùng gõ
  useEffect(() => {
    const identifier = setTimeout(() => {
        // Chỉ apply nếu giá trị min hoặc max thực sự thay đổi so với filter hiện tại
        // để tránh gọi applyPriceFilter không cần thiết khi component re-render
        if (parseFloat(priceRange.min) !== parseFloat(filters.minPrice) ||
            parseFloat(priceRange.max) !== parseFloat(filters.maxPrice) ||
            (priceRange.min === '' && filters.minPrice !== undefined) ||
            (priceRange.max === '' && filters.maxPrice !== undefined) ) {
             applyPriceFilter();
        }
    }, 800); // Delay 800ms sau khi ngừng gõ
    return () => clearTimeout(identifier);
  }, [priceRange, applyPriceFilter, filters.minPrice, filters.maxPrice]);


  const handleReset = () => {
    setFilters({});
    setPriceRange({ min: '', max: '' });
    onFilterChange({});
  };

  if (isLoadingExternally || optionsLoading) {
    return (
        <div className="product-filter-sidebar mb-4 p-3 text-center">
            <Spinner animation="border" size="sm" variant="secondary" />
            <small className="d-block text-muted mt-1">Đang tải bộ lọc...</small>
        </div>
    );
  }
  if (optionsError) {
      return <div className="product-filter-sidebar mb-4 p-3"><small className="text-danger">Lỗi tải bộ lọc.</small></div>
  }


  return (
    <div className="product-filter-sidebar mb-4 p-3 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="filter-main-title mb-0">Lọc sản phẩm</h5>
        <Button variant="link" size="sm" onClick={handleReset} className="text-muted p-0 filter-reset-all">
          Xóa tất cả
        </Button>
      </div>

      <Accordion defaultActiveKey={['0', '1', '2', '3']} alwaysOpen flush>
        {/* Category Filter */}
        {categories.length > 0 && (
            <Accordion.Item eventKey="0">
            <Accordion.Header className="filter-accordion-header">Danh mục</Accordion.Header>
            <Accordion.Body>
                <Form.Select
                name="categoryId"
                value={filters.categoryId || ''}
                onChange={(e) => handleFilterItemChange('categoryId', e.target.value)}
                size="sm"
                aria-label="Category filter"
                >
                <option value="">Tất cả danh mục</option>
                {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                ))}
                </Form.Select>
            </Accordion.Body>
            </Accordion.Item>
        )}

        {/* Size Filter */}
        {sizes.length > 0 && (
            <Accordion.Item eventKey="1">
            <Accordion.Header className="filter-accordion-header">Kích thước</Accordion.Header>
            <Accordion.Body className="filter-options-body">
                {sizes.map(size => (
                <Button
                    key={size.size_id}
                    variant={String(filters.sizeId) === String(size.size_id) ? "dark" : "outline-secondary"}
                    size="sm"
                    className={`me-1 mb-1 filter-tag-btn ${String(filters.sizeId) === String(size.size_id) ? 'active' : ''}`}
                    onClick={() => handleFilterItemChange('sizeId', String(filters.sizeId) === String(size.size_id) ? '' : size.size_id)}
                    aria-pressed={String(filters.sizeId) === String(size.size_id)}
                >
                    {size.size_name}
                </Button>
                ))}
            </Accordion.Body>
            </Accordion.Item>
        )}

        {/* Color Filter */}
        {colors.length > 0 && (
            <Accordion.Item eventKey="2">
            <Accordion.Header className="filter-accordion-header">Màu sắc</Accordion.Header>
            <Accordion.Body className="color-filter-body">
                {colors.map(color => (
                <div
                    key={color.color_id}
                    className={`color-swatch-filter ${String(filters.colorId) === String(color.color_id) ? 'selected' : ''}`}
                    style={{ backgroundColor: color.color_hex || '#ccc' }}
                    title={color.color_name}
                    onClick={() => handleFilterItemChange('colorId', String(filters.colorId) === String(color.color_id) ? '' : color.color_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilterItemChange('colorId', String(filters.colorId) === String(color.color_id) ? '' : color.color_id)}
                    aria-pressed={String(filters.colorId) === String(color.color_id)}
                    aria-label={`Filter by color ${color.color_name}`}
                >
                 {String(filters.colorId) === String(color.color_id) && <i className="bi bi-check filter-color-check"></i>}
                </div>
                ))}
            </Accordion.Body>
            </Accordion.Item>
        )}

        {/* Price Range Filter */}
        <Accordion.Item eventKey="3">
          <Accordion.Header className="filter-accordion-header">Khoảng giá</Accordion.Header>
          <Accordion.Body>
            <Row className="g-2">
              <Col>
                <Form.Group controlId="filterMinPrice">
                  <Form.Label visuallyHidden>Giá thấp nhất</Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    name="min"
                    value={priceRange.min}
                    onChange={handlePriceChange}
                    placeholder="Từ (VNĐ)"
                    aria-label="Minimum price"
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="filterMaxPrice">
                   <Form.Label visuallyHidden>Giá cao nhất</Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    name="max"
                    value={priceRange.max}
                    onChange={handlePriceChange}
                    placeholder="Đến (VNĐ)"
                    aria-label="Maximum price"
                  />
                </Form.Group>
              </Col>
            </Row>
             {/* Nút Apply giá bị ẩn đi vì đã dùng debounce */}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}

export default React.memo(ProductFilter);