// src/components/product/ProductFilter.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../common/LoadingSpinner'; // Component spinner của bạn
import AlertMessage from '../common/AlertMessage'; // Component alert của bạn
import { formatCurrency } from '../../utils/formatters'; // Import hàm định dạng tiền tệ

// Import query GET_PRODUCT_FILTERS_DATA_QUERY từ file .gql của bạn
// (Đảm bảo query này đã được định nghĩa trong src/services/graphql/productQueries.gql)
// Ví dụ: import { GET_PRODUCT_FILTERS_DATA_QUERY } from '../../services/graphql/productQueries';

// Tạm thời định nghĩa query ở đây nếu chưa có file riêng
const GET_PRODUCT_FILTERS_DATA_QUERY = gql`
  query GetProductFiltersData($lang: String) {
    categories(lang: $lang) {
      category_id
      name(lang: $lang)
    }
    collections(lang: $lang) {
      collection_id
      name(lang: $lang)
      slug
    }
    publicGetAllColors(lang: $lang) {
      color_id
      name(lang: $lang)
      color_hex
    }
    sizes {
      size_id
      size_name
    }
  }
`;


const ProductFilter = ({ currentFilters = {}, onFilterChange, isLoadingExternally = false }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const [internalFilters, setInternalFilters] = useState(currentFilters);
  const [priceValues, setPriceValues] = useState({
    min: currentFilters.min_price || '',
    max: currentFilters.max_price || '',
  });

  const { data: optionsData, loading: optionsLoading, error: optionsError } = useQuery(GET_PRODUCT_FILTERS_DATA_QUERY, {
    variables: { lang: currentLang },
  });

  // Cập nhật internalFilters khi currentFilters từ component cha thay đổi (ví dụ: từ URL)
  useEffect(() => {
    setInternalFilters(currentFilters);
    setPriceValues({
        min: currentFilters.min_price || '',
        max: currentFilters.max_price || ''
    });
  }, [currentFilters]);


  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...internalFilters, [name]: value || null }; // Nếu value rỗng thì coi như null
    setInternalFilters(newFilters);
    onFilterChange(newFilters); // Gọi ngay khi thay đổi select
  };

  const handleToggleFilter = (filterName, value) => {
    const currentFilterValue = internalFilters[filterName];
    let newValue;
    if (Array.isArray(currentFilterValue)) {
      newValue = currentFilterValue.includes(value)
        ? currentFilterValue.filter(v => v !== value)
        : [...currentFilterValue, value];
      if (newValue.length === 0) newValue = null; // Nếu mảng rỗng thì coi như null
    } else {
      newValue = currentFilterValue === value ? null : value; // Toggle
    }
    const newFilters = { ...internalFilters, [filterName]: newValue };
    setInternalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceInputChange = (e) => {
    const { name, value } = e.target;
    setPriceValues(prev => ({ ...prev, [name]: value }));
  };

  const applyPriceFilter = () => {
    const newFilters = { ...internalFilters };
    if (priceValues.min) newFilters.min_price = parseFloat(priceValues.min); else delete newFilters.min_price;
    if (priceValues.max) newFilters.max_price = parseFloat(priceValues.max); else delete newFilters.max_price;
    setInternalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleResetFilters = () => {
    setInternalFilters({});
    setPriceValues({ min: '', max: '' });
    onFilterChange({});
  };


  if (isLoadingExternally || optionsLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg shadow animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="mb-6">
            <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
            <div className="h-8 bg-gray-300 rounded w-full mb-1"></div>
            <div className="h-8 bg-gray-300 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (optionsError) {
    return <AlertMessage type="error" message={t('productFilter.errorLoadingFilters', 'Lỗi tải bộ lọc.')} />;
  }

  const { categories = [], collections = [], publicGetAllColors: colors = [], sizes = [] } = optionsData || {};

  return (
    <aside className="w-full lg:w-72 xl:w-80 p-4 space-y-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center border-b pb-3 mb-3">
        <h2 className="text-xl font-semibold text-gray-800">{t('productFilter.title', 'Bộ lọc')}</h2>
        <button
          onClick={handleResetFilters}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          {t('productFilter.resetAll', 'Xóa tất cả')}
        </button>
      </div>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <div className="filter-group">
          <h3 className="text-md font-semibold mb-2 text-gray-700">{t('productFilter.categoryLabel', 'Danh mục')}</h3>
          <select
            name="category_id"
            value={internalFilters.category_id || ''}
            onChange={handleSelectChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">{t('productFilter.allCategories', 'Tất cả danh mục')}</option>
            {categories.map(cat => (
              <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Collections Filter (Tương tự categories) */}
      {collections.length > 0 && (
        <div className="filter-group">
          <h3 className="text-md font-semibold mb-2 text-gray-700">{t('productFilter.collectionLabel', 'Bộ sưu tập')}</h3>
          <select
            name="collection_id"
            value={internalFilters.collection_id || ''}
            onChange={handleSelectChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">{t('productFilter.allCollections', 'Tất cả BST')}</option>
            {collections.map(col => (
              <option key={col.collection_id} value={col.collection_id}>{col.name}</option>
            ))}
          </select>
        </div>
      )}


      {/* Price Filter */}
      <div className="filter-group">
        <h3 className="text-md font-semibold mb-2 text-gray-700">{t('productFilter.priceRangeLabel', 'Khoảng giá')}</h3>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            name="min"
            value={priceValues.min}
            onChange={handlePriceInputChange}
            placeholder={t('productFilter.minPricePlaceholder', 'Từ')}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            name="max"
            value={priceValues.max}
            onChange={handlePriceInputChange}
            placeholder={t('productFilter.maxPricePlaceholder', 'Đến')}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        </div>
        <button
            onClick={applyPriceFilter}
            className="mt-2 w-full bg-blue-500 text-white py-1.5 px-3 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
        >
            {t('productFilter.applyPrice', 'Áp dụng giá')}
        </button>
      </div>

      {/* Color Filter */}
      {colors.length > 0 && (
        <div className="filter-group">
          <h3 className="text-md font-semibold mb-2 text-gray-700">{t('productFilter.colorLabel', 'Màu sắc')}</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => (
              <button
                key={color.color_id}
                type="button"
                title={color.name}
                onClick={() => handleToggleFilter('color_id', color.color_id)}
                className={`w-6 h-6 rounded-full border-2 transition-all duration-150
                            ${internalFilters.color_id === color.color_id ? 'ring-2 ring-offset-1 ring-blue-500 border-white scale-110' : 'border-gray-300 hover:border-gray-400'}
                            ${color.color_hex === '#FFFFFF' || color.color_hex === '#FFF' ? '!border-gray-400' : ''}
                            `}
                style={{ backgroundColor: color.color_hex || '#DDDDDD' }}
                aria-pressed={internalFilters.color_id === color.color_id}
              >
                {internalFilters.color_id === color.color_id && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Filter */}
      {sizes.length > 0 && (
        <div className="filter-group">
          <h3 className="text-md font-semibold mb-2 text-gray-700">{t('productFilter.sizeLabel', 'Kích thước')}</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map(size => (
              <button
                key={size.size_id}
                type="button"
                onClick={() => handleToggleFilter('size_id', size.size_id)}
                className={`px-3 py-1 border rounded-md text-xs sm:text-sm transition-colors
                                ${internalFilters.size_id === size.size_id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400'}`}
                aria-pressed={internalFilters.size_id === size.size_id}
              >
                {size.size_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default React.memo(ProductFilter);