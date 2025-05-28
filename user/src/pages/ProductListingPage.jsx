// src/pages/ProductListingPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Đảm bảo đã import useTranslation

import { GET_PRODUCTS_QUERY } from '../api/graphql/productQueries';
import ProductFilter from '../components/product/ProductFilter';
import ProductGrid from '../components/product/ProductGrid';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import { ITEMS_PER_PAGE_DEFAULT } from '../utils/constants';

const ProductListingPage = ({
  pageType = 'all',
  slug,
  pageTitleKey,
  pageTitleDefault,
  filterId,
}) => {
  const { t, i18n } = useTranslation(); // Lấy i18n instance từ hook useTranslation

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const initialFilters = useMemo(() => {
    const params = {};
    if (searchParams.get('categories')) params.categories = searchParams.get('categories').split(',');
    if (searchParams.get('collections')) params.collections = searchParams.get('collections').split(',');
    if (searchParams.get('colors')) params.colors = searchParams.get('colors').split(',');
    if (searchParams.get('sizes')) params.sizes = searchParams.get('sizes').split(',');
    if (searchParams.get('minPrice') || searchParams.get('maxPrice')) {
      params.priceRange = {
        min: parseInt(searchParams.get('minPrice') || '0', 10),
        max: parseInt(searchParams.get('maxPrice') || '100000000', 10),
      };
    }
    return params;
  }, [searchParams]);

  const [activeFilters, setActiveFilters] = useState(initialFilters);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE_DEFAULT), 10);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'DESC';
  const currentLang = searchParams.get('lang') || i18n.language || 'vi'; // Bây giờ i18n đã được định nghĩa

  const baseFilter = {};
  if (pageType === 'collection' && filterId) {
    baseFilter.collection_id = filterId;
  } else if (pageType === 'category' && filterId) {
    baseFilter.category_id = filterId;
  }

  const queryVariables = {
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    lang: currentLang,
    filter: {
      ...baseFilter,
      ...(activeFilters.categories?.length && { category_id: activeFilters.categories[0] }),
      ...(activeFilters.collections?.length && { collection_id: activeFilters.collections[0] }),
      ...(activeFilters.colors?.length && { color_id: activeFilters.colors[0] }),
      ...(activeFilters.sizes?.length && { size_id: activeFilters.sizes[0] }),
      ...(activeFilters.priceRange && {
          min_price: activeFilters.priceRange.min,
          max_price: activeFilters.priceRange.max
      }),
    },
  };

  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS_QUERY, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.categories?.length) params.set('categories', newFilters.categories.join(','));
    if (newFilters.collections?.length) params.set('collections', newFilters.collections.join(','));
    if (newFilters.colors?.length) params.set('colors', newFilters.colors.join(','));
    if (newFilters.sizes?.length) params.set('sizes', newFilters.sizes.join(','));
    if (newFilters.priceRange) {
      params.set('minPrice', newFilters.priceRange.min.toString());
      params.set('maxPrice', newFilters.priceRange.max.toString());
    }
    params.set('page', '1');
    if(currentLang) params.set('lang', currentLang);
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    const params = new URLSearchParams();
    params.set('page', '1');
    if(currentLang) params.set('lang', currentLang);
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (e) => {
    const [newSortBy, newSortOrder] = e.target.value.split('_');
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    setSearchParams(params);
  };

  const products = data?.products?.products || [];
  const totalProducts = data?.products?.count || 0;

  const finalPageTitle = pageTitleKey
    ? t(pageTitleKey, { defaultValue: pageTitleDefault || "Sản phẩm", name: slug || '' })
    : pageTitleDefault || t('products.allProductsTitle', "Tất cả sản phẩm");

  // --- CONSOLE LOGS ĐỂ DEBUG ---
  // console.log("ProductListingPage Props:", { pageType, slug, pageTitleKey, pageTitleDefault, filterId });
  // console.log("ProductListingPage queryVariables:", JSON.stringify(queryVariables, null, 2));
  // console.log("ProductListingPage GraphQL Data:", data);
  // console.log("ProductListingPage Loading:", loading);
  // console.log("ProductListingPage Error:", error);
  // console.log("ProductListingPage Parsed Products (count):", products.length);
  // console.log("ProductListingPage Total Products from API:", totalProducts);
  // --- KẾT THÚC CONSOLE LOGS ---

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {finalPageTitle}
        </h1>
        <div className="mt-4 md:flex md:items-center md:justify-between text-sm text-gray-600">
            <p>
                {(!loading && products.length === 0 && totalProducts === 0) ? "" :
                  loading && products.length === 0 ? t('products.loadingProducts', 'Đang tải sản phẩm...') :
                    t('products.showingResults', 'Hiển thị {{count}} trên tổng số {{total}} sản phẩm', { count: products.length, total: totalProducts})
                }
            </p>
            <div className="mt-2 md:mt-0">
                <label htmlFor="sort-products" className="sr-only">{t('products.sortBy', 'Sắp xếp theo')}</label>
                <select
                    id="sort-products"
                    name="sort-products"
                    className="pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md bg-white shadow-sm"
                    value={`${sortBy}_${sortOrder}`}
                    onChange={handleSortChange}
                    disabled
                >
                    <option value="createdAt_DESC">{t('products.sort.newest', 'Mới nhất')}</option>
                </select>
            </div>
        </div>
      </header>

      <div className="lg:flex lg:space-x-8">
        <div className="w-full lg:w-1/4 xl:w-1/5 mb-8 lg:mb-0">
          <ProductFilter
            currentFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="w-full lg:w-3/4 xl:w-4/5">
          {loading && products.length === 0 && (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          )}
          {error && (
            <AlertMessage type="error" title={t('products.errorLoadingTitle')} message={error.message || t('common.errorOccurred')} className="mb-6"/>
          )}
          
          {(!loading || products.length > 0) && !error && (
            <ProductGrid
                products={products}
                loading={loading && products.length > 0}
            />
          )}

          {!loading && !error && products.length === 0 && totalProducts === 0 && (
             <div className="my-8 text-center">
                <AlertMessage type="info" message={t('products.noProductsFound', 'Không tìm thấy sản phẩm nào phù hợp.')} />
             </div>
          )}

          {totalProducts > itemsPerPage && !error && products.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalItems={totalProducts}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListingPage;