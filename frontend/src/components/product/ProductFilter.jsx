// src/components/product/ProductFilter.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Accordion, Spinner, Row, Col } from 'react-bootstrap';
import { useQuery } from '@apollo/client';
import { GET_FILTER_OPTIONS_QUERY } from '../../api/graphql/queries/productQueries';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './ProductFilter.css';

function ProductFilter({ initialFilters = {}, onFilterChange, isLoadingExternally = false }) {
  const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
  const [filters, setFilters] = useState(initialFilters);
  const [priceRange, setPriceRange] = useState({ min: initialFilters.minPrice || '', max: initialFilters.maxPrice || '' });

  // Fetch options cho filter, truyền ngôn ngữ hiện tại nếu query hỗ trợ
  // Giả định GET_FILTER_OPTIONS_QUERY đã được cập nhật để nhận 'lang' hoặc resolver tự xử lý
  const { data: optionsData, loading: optionsLoading, error: optionsError } = useQuery(GET_FILTER_OPTIONS_QUERY, {
    variables: { lang: i18n.language } // Thêm biến lang nếu query của bạn hỗ trợ
  });

  // Sử dụng tên đã được dịch từ resolver (nếu có) hoặc dịch ở client
  const categories = useMemo(() => {
    return optionsData?.categories?.map(cat => ({
      ...cat,
      // Giả định resolver trả về 'name' đã dịch, hoặc bạn có trường 'name_vi', 'name_en'
      // Nếu không, bạn có thể tạo key dịch động: t(`category.${cat.category_id}`)
      category_name: cat.name || (i18n.language === 'en' && cat.category_name_en ? cat.category_name_en : cat.category_name_vi)
    })) || [];
  }, [optionsData?.categories, i18n.language, t]);

  const sizes = useMemo(() => {
    return optionsData?.sizes?.map(size => ({
      ...size,
      // Size thường không cần dịch, nhưng nếu có thể thì xử lý tương tự category
      size_name: size.size_name 
    })) || [];
  }, [optionsData?.sizes]);

  const colors = useMemo(() => {
    return optionsData?.availableColors?.map(color => ({
      ...color,
      // Tương tự, nếu color name cần dịch và resolver không tự xử lý
      color_name: color.name || (i18n.language === 'en' && color.color_name_en ? color.color_name_en : color.color_name)
    })) || [];
  }, [optionsData?.availableColors, i18n.language, t]);


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

  useEffect(() => {
    const identifier = setTimeout(() => {
        if (parseFloat(priceRange.min) !== parseFloat(filters.minPrice) ||
            parseFloat(priceRange.max) !== parseFloat(filters.maxPrice) ||
            (priceRange.min === '' && filters.minPrice !== undefined) ||
            (priceRange.max === '' && filters.maxPrice !== undefined) ) {
             applyPriceFilter();
        }
    }, 800);
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
            <small className="d-block text-muted mt-1">{t('productFilter.loadingFilters')}</small>
        </div>
    );
  }
  if (optionsError) {
      return <div className="product-filter-sidebar mb-4 p-3"><small className="text-danger">{t('productFilter.errorLoadingFilters')}</small></div>;
  }

  return (
    <div className="product-filter-sidebar mb-4 p-3 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="filter-main-title mb-0">{t('productFilter.title')}</h5>
        <Button variant="link" size="sm" onClick={handleReset} className="text-muted p-0 filter-reset-all">
          {t('productFilter.resetAll')}
        </Button>
      </div>

      <Accordion defaultActiveKey={['0', '1', '2', '3']} alwaysOpen flush>
        {categories.length > 0 && (
            <Accordion.Item eventKey="0">
            <Accordion.Header className="filter-accordion-header">{t('productFilter.categoryLabel')}</Accordion.Header>
            <Accordion.Body>
                <Form.Select
                name="categoryId"
                value={filters.categoryId || ''}
                onChange={(e) => handleFilterItemChange('categoryId', e.target.value)}
                size="sm"
                aria-label={t('productFilter.categoryAriaLabel')}
                >
                <option value="">{t('productFilter.allCategories')}</option>
                {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                ))}
                </Form.Select>
            </Accordion.Body>
            </Accordion.Item>
        )}

        {sizes.length > 0 && (
            <Accordion.Item eventKey="1">
            <Accordion.Header className="filter-accordion-header">{t('productFilter.sizeLabel')}</Accordion.Header>
            <Accordion.Body className="filter-options-body">
                {sizes.map(size => (
                <Button
                    key={size.size_id}
                    variant={String(filters.sizeId) === String(size.size_id) ? "dark" : "outline-secondary"}
                    size="sm"
                    className={`me-1 mb-1 filter-tag-btn ${String(filters.sizeId) === String(size.size_id) ? 'active' : ''}`}
                    onClick={() => handleFilterItemChange('sizeId', String(filters.sizeId) === String(size.size_id) ? '' : size.size_id)}
                    aria-pressed={String(filters.sizeId) === String(size.size_id)}
                    title={t('productFilter.selectSizeTitle', { sizeName: size.size_name })}
                >
                    {size.size_name}
                </Button>
                ))}
            </Accordion.Body>
            </Accordion.Item>
        )}

        {colors.length > 0 && (
            <Accordion.Item eventKey="2">
            <Accordion.Header className="filter-accordion-header">{t('productFilter.colorLabel')}</Accordion.Header>
            <Accordion.Body className="color-filter-body">
                {colors.map(color => (
                <div
                    key={color.color_id}
                    className={`color-swatch-filter ${String(filters.colorId) === String(color.color_id) ? 'selected' : ''}`}
                    style={{ backgroundColor: color.color_hex || '#ccc' }}
                    title={t('productFilter.selectColorTitle', { colorName: color.color_name })}
                    onClick={() => handleFilterItemChange('colorId', String(filters.colorId) === String(color.color_id) ? '' : color.color_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilterItemChange('colorId', String(filters.colorId) === String(color.color_id) ? '' : color.color_id)}
                    aria-pressed={String(filters.colorId) === String(color.color_id)}
                    aria-label={t('productFilter.selectColorAriaLabel', { colorName: color.color_name })}
                >
                 {String(filters.colorId) === String(color.color_id) && <i className="bi bi-check filter-color-check"></i>}
                </div>
                ))}
            </Accordion.Body>
            </Accordion.Item>
        )}

        <Accordion.Item eventKey="3">
          <Accordion.Header className="filter-accordion-header">{t('productFilter.priceRangeLabel')}</Accordion.Header>
          <Accordion.Body>
            <Row className="g-2">
              <Col>
                <Form.Group controlId="filterMinPrice">
                  <Form.Label visuallyHidden>{t('productFilter.minPriceLabel')}</Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    name="min"
                    value={priceRange.min}
                    onChange={handlePriceChange}
                    placeholder={t('productFilter.minPricePlaceholder')}
                    aria-label={t('productFilter.minPriceAriaLabel')}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="filterMaxPrice">
                   <Form.Label visuallyHidden>{t('productFilter.maxPriceLabel')}</Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    name="max"
                    value={priceRange.max}
                    onChange={handlePriceChange}
                    placeholder={t('productFilter.maxPricePlaceholder')}
                    aria-label={t('productFilter.maxPriceAriaLabel')}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}

export default React.memo(ProductFilter);