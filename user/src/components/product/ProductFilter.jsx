// user/src/components/product/ProductFilter.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
// Import các query (cần tạo file và định nghĩa các query này)
import {
  // GET_FILTER_CATEGORIES_QUERY, // Bỏ comment khi có query
  // GET_FILTER_COLLECTIONS_QUERY,
  // GET_FILTER_COLORS_QUERY,
  // GET_FILTER_SIZES_QUERY,
  // GET_PRICE_RANGE_QUERY,
} from '../../api/graphql/filterQueries'; // Hoặc productQueries.js
import LoadingSpinner from '../common/LoadingSpinner';
import useToggle from '../../hooks/useToggle'; // Hook useToggle

const FilterSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, toggleOpen] = useToggle(defaultOpen);
  return (
    <div className="py-4 border-b border-gray-200 last:border-b-0">
      <button
        onClick={toggleOpen}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-gray-800">{title}</span>
        {isOpen ? <FiChevronUp className="h-5 w-5 text-gray-400" /> : <FiChevronDown className="h-5 w-5 text-gray-400" />}
      </button>
      {isOpen && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
};

const ProductFilter = ({ currentFilters = {}, onFilterChange, onClearFilters }) => {
  const { t } = useTranslation();
  const [selectedCategories, setSelectedCategories] = useState(currentFilters.categories || []);
  const [selectedCollections, setSelectedCollections] = useState(currentFilters.collections || []);
  const [selectedColors, setSelectedColors] = useState(currentFilters.colors || []);
  const [selectedSizes, setSelectedSizes] = useState(currentFilters.sizes || []);
  const [priceRange, setPriceRange] = useState(currentFilters.priceRange || { min: 0, max: 10000000 }); // Giá trị mặc định lớn

  // ---- API Calls cho Filter Options (Bỏ comment khi query sẵn sàng) ----
  // const { data: categoriesData, loading: categoriesLoading } = useQuery(GET_FILTER_CATEGORIES_QUERY);
  // const { data: collectionsData, loading: collectionsLoading } = useQuery(GET_FILTER_COLLECTIONS_QUERY);
  // const { data: colorsData, loading: colorsLoading } = useQuery(GET_FILTER_COLORS_QUERY);
  // const { data: sizesData, loading: sizesLoading } = useQuery(GET_FILTER_SIZES_QUERY);
  // const { data: priceRangeData, loading: priceRangeLoading } = useQuery(GET_PRICE_RANGE_QUERY);

  // useEffect(() => {
  //   if (priceRangeData?.productPriceRange) {
  //     if (!currentFilters.priceRange) { // Chỉ set mặc định nếu chưa có filter giá từ props
  //       setPriceRange(priceRangeData.productPriceRange);
  //     }
  //   }
  // }, [priceRangeData, currentFilters.priceRange]);

  // Placeholder data (thay thế bằng data từ API sau)
  const categoriesData = { filterableCategories: [{id: 'cat1', name: 'Áo Thun', slug: 'ao-thun'}, {id: 'cat2', name: 'Quần Jeans', slug: 'quan-jeans'}] };
  const collectionsData = { filterableCollections: [{id: 'col1', name: 'Bộ Sưu Tập Hè', slug: 'bst-he'}, {id: 'col2', name: 'Đồ Công Sở', slug: 'do-cong-so'}] };
  const colorsData = { filterableColors: [{id: 'color1', name: 'Đỏ', hexCode: '#FF0000'}, {id: 'color2', name: 'Xanh Dương', hexCode: '#0000FF'}] };
  const sizesData = { filterableSizes: [{id: 'size1', name: 'S'}, {id: 'size2', name: 'M'}, {id: 'size3', name: 'L'}] };
  const priceRangeData = { productPriceRange: { min: 0, max: 5000000 }};
  const categoriesLoading = false, collectionsLoading = false, colorsLoading = false, sizesLoading = false, priceRangeLoading = false;

   useEffect(() => {
    if (priceRangeData?.productPriceRange && !currentFilters.priceRange) {
      setPriceRange(priceRangeData.productPriceRange);
    }
  }, [priceRangeData, currentFilters.priceRange]);

  const handleCheckboxChange = (setter, selectedValues, value) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    setter(newSelectedValues);
  };

  const handlePriceInputChange = (e, type) => {
    const value = parseInt(e.target.value, 10);
    setPriceRange((prev) => ({
      ...prev,
      [type]: isNaN(value) ? (type === 'min' ? 0 : priceRangeData?.productPriceRange?.max || 10000000) : value,
    }));
  };

  const applyFilters = () => {
    onFilterChange({
      categories: selectedCategories,
      collections: selectedCollections,
      colors: selectedColors,
      sizes: selectedSizes,
      priceRange: (priceRange.min === (priceRangeData?.productPriceRange?.min || 0) && priceRange.max === (priceRangeData?.productPriceRange?.max || 10000000)) ? undefined : priceRange,
      // Thêm các filter khác nếu có (ví dụ: sortBy)
    });
  };
  
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedCollections([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange(priceRangeData?.productPriceRange || { min: 0, max: 10000000 });
    if (onClearFilters) {
        onClearFilters(); // Gọi hàm từ component cha để reset cả query params nếu cần
    } else { // Nếu không có hàm onClearFilters, tự gọi onFilterChange với object rỗng
        onFilterChange({});
    }
  };


  const renderLoading = () => <LoadingSpinner size="sm" className="my-2"/>;

  return (
    <aside className="w-full lg:w-64 xl:w-72 bg-white p-5 rounded-lg shadow-md lg:sticky lg:top-24 self-start"> {/* Sticky sidebar */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('filter.title', 'Bộ lọc')}</h3>
        <button
          onClick={clearAllFilters}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {t('filter.clearAll', 'Xóa tất cả')}
        </button>
      </div>

      {/* Categories Filter */}
      {/* {categoriesLoading ? renderLoading() : categoriesData?.filterableCategories?.length > 0 && (
        <FilterSection title={t('filter.categories', 'Danh mục')} defaultOpen={true}>
          {categoriesData.filterableCategories.map((category) => (
            <label key={category.id} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                value={category.slug || category.id} // Sử dụng slug hoặc id làm value
                checked={selectedCategories.includes(category.slug || category.id)}
                onChange={(e) => handleCheckboxChange(setSelectedCategories, selectedCategories, e.target.value)}
              />
              <span>{category.name}</span>
            </label>
          ))}
        </FilterSection>
      )} */}
      
      {/* Collections Filter */}
      {/* {collectionsLoading ? renderLoading() : collectionsData?.filterableCollections?.length > 0 && (
        <FilterSection title={t('filter.collections', 'Bộ sưu tập')}>
          {collectionsData.filterableCollections.map((collection) => (
            <label key={collection.id} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                value={collection.slug || collection.id}
                checked={selectedCollections.includes(collection.slug || collection.id)}
                onChange={(e) => handleCheckboxChange(setSelectedCollections, selectedCollections, e.target.value)}
              />
              <span>{collection.name}</span>
            </label>
          ))}
        </FilterSection>
      )} */}

      {/* Price Range Filter */}
      {priceRangeLoading ? renderLoading() : priceRangeData?.productPriceRange && (
        <FilterSection title={t('filter.price', 'Giá')} defaultOpen={true}>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder={t('filter.minPrice', 'Từ')}
              value={priceRange.min}
              min={priceRangeData.productPriceRange.min}
              max={priceRange.max}
              onChange={(e) => handlePriceInputChange(e, 'min')}
              className="w-1/2 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span>-</span>
            <input
              type="number"
              placeholder={t('filter.maxPrice', 'Đến')}
              value={priceRange.max}
              min={priceRange.min}
              max={priceRangeData.productPriceRange.max}
              onChange={(e) => handlePriceInputChange(e, 'max')}
              className="w-1/2 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {/* Có thể thêm slider ở đây nếu muốn, ví dụ dùng react-slider */}
        </FilterSection>
      )}
      
      {/* Colors Filter */}
      {/* {colorsLoading ? renderLoading() : colorsData?.filterableColors?.length > 0 && (
        <FilterSection title={t('filter.color', 'Màu sắc')}>
          <div className="flex flex-wrap gap-2">
            {colorsData.filterableColors.map((color) => (
              <button
                key={color.id}
                onClick={() => handleCheckboxChange(setSelectedColors, selectedColors, color.id)} // Giả sử value là color.id
                className={`w-6 h-6 rounded-full border-2 ${selectedColors.includes(color.id) ? 'ring-2 ring-offset-1 ring-indigo-500 border-white' : 'border-gray-300'} focus:outline-none`}
                style={{ backgroundColor: color.hexCode || color.name.toLowerCase() }}
                aria-label={color.name}
              />
            ))}
          </div>
        </FilterSection>
      )} */}

      {/* Sizes Filter */}
      {/* {sizesLoading ? renderLoading() : sizesData?.filterableSizes?.length > 0 && (
        <FilterSection title={t('filter.size', 'Kích thước')}>
          <div className="flex flex-wrap gap-2">
            {sizesData.filterableSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => handleCheckboxChange(setSelectedSizes, selectedSizes, size.id)} // Giả sử value là size.id
                className={`px-2.5 py-1 text-xs border rounded-md ${selectedSizes.includes(size.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {size.name}
              </button>
            ))}
          </div>
        </FilterSection>
      )} */}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={applyFilters}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-indigo-700 transition-colors duration-150 text-sm"
        >
          {t('filter.applyButton', 'Áp dụng bộ lọc')}
        </button>
      </div>
    </aside>
  );
};

export default ProductFilter;