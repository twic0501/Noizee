// src/components/product/ProductFilter.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';
import useToggle from '../../hooks/useToggle';

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

// Define ALL placeholder/default objects that might be dependencies and are defined in-component OUTSIDE or MEMOIZE them.
const STABLE_PLACEHOLDER_PRICE_RANGE = { min: 0, max: 10000000 };

// If you are using these as placeholders when Apollo query is loading/error or not yet run:
const STABLE_CATEGORIES_DATA = { filterableCategories: [{id: 'cat1', name: 'Áo Thun', slug: 'ao-thun'}, {id: 'cat2', name: 'Quần Jeans', slug: 'quan-jeans'}] };
const STABLE_COLLECTIONS_DATA = { filterableCollections: [{id: 'col1', name: 'Bộ Sưu Tập Hè', slug: 'bst-he'}, {id: 'col2', name: 'Đồ Công Sở', slug: 'do-cong-so'}] };
const STABLE_COLORS_DATA = { filterableColors: [{id: 'color1', name: 'Đỏ', hexCode: '#FF0000'}, {id: 'color2', name: 'Xanh Dương', hexCode: '#0000FF'}] };
const STABLE_SIZES_DATA = { filterableSizes: [{id: 'size1', name: 'S'}, {id: 'size2', name: 'M'}, {id: 'size3', name: 'L'}] };
const STABLE_PRICE_RANGE_API_DATA = { productPriceRange: { min: 50000, max: 5000000 }};


const ProductFilter = ({ currentFilters = {}, onFilterChange, onClearFilters }) => {
  const { t } = useTranslation();
  const [selectedCategories, setSelectedCategories] = useState(currentFilters.categories || []);
  const [selectedCollections, setSelectedCollections] = useState(currentFilters.collections || []);
  const [selectedColors, setSelectedColors] = useState(currentFilters.colors || []);
  const [selectedSizes, setSelectedSizes] = useState(currentFilters.sizes || []);
  
  const placeholderPriceRange = STABLE_PLACEHOLDER_PRICE_RANGE; 
  const [priceRange, setPriceRange] = useState(currentFilters.priceRange || placeholderPriceRange);
  const initialPriceRangeFromApiSet = useRef(false);

  // ---- API Calls cho Filter Options ----
  // Assuming you'd replace placeholders with actual useQuery hooks when ready
  // const { data: categoriesDataRaw, loading: categoriesLoading } = useQuery(GET_FILTER_CATEGORIES_QUERY);
  // const { data: collectionsDataRaw, loading: collectionsLoading } = useQuery(GET_FILTER_COLLECTIONS_QUERY);
  // const { data: colorsDataRaw, loading: colorsLoading } = useQuery(GET_FILTER_COLORS_QUERY);
  // const { data: sizesDataRaw, loading: sizesLoading } = useQuery(GET_FILTER_SIZES_QUERY);
  // const { data: priceRangeApiDataRaw, loading: priceRangeLoading } = useQuery(GET_PRICE_RANGE_QUERY);

  // Use stable placeholders or data from Apollo (which should also be stable unless content changes)
  const categoriesData = STABLE_CATEGORIES_DATA; // Replace with categoriesDataRaw when using useQuery
  const collectionsData = STABLE_COLLECTIONS_DATA; // Replace with collectionsDataRaw
  const colorsData = STABLE_COLORS_DATA; // Replace with colorsDataRaw
  const sizesData = STABLE_SIZES_DATA; // Replace with sizesDataRaw
  const priceRangeDataFromApi = STABLE_PRICE_RANGE_API_DATA; // Replace with priceRangeApiDataRaw
  const categoriesLoading = false, collectionsLoading = false, colorsLoading = false, sizesLoading = false, priceRangeLoading = false; // Adjust with useQuery loading states


  useEffect(() => {
    if (priceRangeDataFromApi?.productPriceRange && !initialPriceRangeFromApiSet.current && !currentFilters.priceRange) {
      setPriceRange(priceRangeDataFromApi.productPriceRange);
      initialPriceRangeFromApiSet.current = true;
    }
  }, [priceRangeDataFromApi, currentFilters.priceRange]);

  useEffect(() => {
    setSelectedCategories(currentFilters.categories || []);
    setSelectedCollections(currentFilters.collections || []);
    setSelectedColors(currentFilters.colors || []);
    setSelectedSizes(currentFilters.sizes || []);
    
    if (currentFilters.priceRange) {
        setPriceRange(currentFilters.priceRange);
        initialPriceRangeFromApiSet.current = true; 
    } else if (priceRangeDataFromApi?.productPriceRange && !initialPriceRangeFromApiSet.current) {
        // priceRangeDataFromApi is now stable or comes from Apollo (which is stable)
        setPriceRange(priceRangeDataFromApi.productPriceRange);
        initialPriceRangeFromApiSet.current = true;
    } else if (!currentFilters.priceRange) {
        // placeholderPriceRange is now stable
        setPriceRange(placeholderPriceRange); 
        initialPriceRangeFromApiSet.current = false; 
    }
  }, [currentFilters, priceRangeDataFromApi, placeholderPriceRange]);


  const handleCheckboxChange = (setter, selectedValues, value) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    setter(newSelectedValues);
  };

  const handlePriceInputChange = (e, type) => {
    const value = parseInt(e.target.value, 10);
    const apiMin = priceRangeDataFromApi?.productPriceRange?.min ?? 0;
    const apiMax = priceRangeDataFromApi?.productPriceRange?.max ?? 100000000;

    setPriceRange((prev) => {
        const newRange = {...prev};
        if (type === 'min') {
            newRange.min = isNaN(value) ? apiMin : Math.max(apiMin, Math.min(value, prev.max -1 || apiMax -1));
        } else { 
            newRange.max = isNaN(value) ? apiMax : Math.min(apiMax, Math.max(value, prev.min + 1 || apiMin + 1));
        }
        return newRange;
    });
  };

  const applyFilters = () => {
    const apiFullRange = priceRangeDataFromApi?.productPriceRange || placeholderPriceRange;
    const priceRangeFilterApplied = 
        (priceRange.min !== apiFullRange.min || priceRange.max !== apiFullRange.max)
        ? priceRange 
        : undefined;

    onFilterChange({
      categories: selectedCategories,
      collections: selectedCollections,
      colors: selectedColors,
      sizes: selectedSizes,
      priceRange: priceRangeFilterApplied,
    });
  };
  
  const clearAllFiltersLocal = () => {
    setSelectedCategories([]);
    setSelectedCollections([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange(priceRangeDataFromApi?.productPriceRange || placeholderPriceRange);
    initialPriceRangeFromApiSet.current = true; 
    if (onClearFilters) {
        onClearFilters(); 
    } else { 
        onFilterChange({});
    }
  };

  const renderLoading = () => <LoadingSpinner size="sm" className="my-2"/>;

  return (
    <aside className="w-full lg:w-64 xl:w-72 bg-white p-5 rounded-lg shadow-md lg:sticky lg:top-24 self-start">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('filter.title', 'Bộ lọc')}</h3>
        <button
          onClick={clearAllFiltersLocal}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {t('filter.clearAll', 'Xóa tất cả')}
        </button>
      </div>

      {categoriesLoading ? renderLoading() : categoriesData?.filterableCategories?.length > 0 && (
        <FilterSection title={t('filter.categories', 'Danh mục')} defaultOpen={true}>
          {categoriesData.filterableCategories.map((category) => (
            <label key={category.id} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                value={category.slug || category.id}
                checked={selectedCategories.includes(category.slug || category.id)}
                onChange={(e) => handleCheckboxChange(setSelectedCategories, selectedCategories, e.target.value)}
              />
              <span>{category.name}</span>
            </label>
          ))}
        </FilterSection>
      )}
      
      {priceRangeLoading ? renderLoading() : (priceRangeDataFromApi?.productPriceRange || currentFilters.priceRange) && (
        <FilterSection title={t('filter.price', 'Giá')} defaultOpen={true}>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder={t('filter.minPrice', 'Từ')}
              value={priceRange.min}
              min={priceRangeDataFromApi?.productPriceRange?.min ?? 0}
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
              max={priceRangeDataFromApi?.productPriceRange?.max ?? 100000000}
              onChange={(e) => handlePriceInputChange(e, 'max')}
              className="w-1/2 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </FilterSection>
      )}
      
      {/* Add other filters (Collections, Colors, Sizes) similarly */}

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