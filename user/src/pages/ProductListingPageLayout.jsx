// user/src/pages/ProductListingPageLayout.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { GET_PRODUCTS_QUERY } from '../../api/graphql/productQueries';
import ProductFilter from '../../components/product/ProductFilter';
import ProductGrid from '../../components/product/ProductGrid';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { ITEMS_PER_PAGE_DEFAULT } from '../../utils/constants';

const ProductListingPageLayout = ({
  filterVariablesForQuery = {}, // ví dụ: { collectionSlug: 'abc' } hoặc { categorySlug: 'xyz' }
  pageTitle = "Sản phẩm",
  // breadcrumbItems = []
}) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters = useMemo(() => { /* ... logic lấy filter từ searchParams ... */ return {}; }, [searchParams]);
  const [activeFilters, setActiveFilters] = useState(initialFilters);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE_DEFAULT), 10);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'DESC';

  const queryVariables = {
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    sortBy: sortBy,
    sortOrder: sortOrder,
    filter: {
      ...filterVariablesForQuery, // Filter cố định theo collection/category
      ...(activeFilters.categories?.length && { categoryIds: activeFilters.categories }),
      // ... các filter khác từ activeFilters ...
      ...(activeFilters.priceRange && { 
          minPrice: activeFilters.priceRange.min, 
          maxPrice: activeFilters.priceRange.max 
      }),
    },
  };

  const { data, loading, error } = useQuery(GET_PRODUCTS_QUERY, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network',
  });

  const handleFilterChange = (newFilters) => { /* ... logic cập nhật searchParams ... */ };
  const handleClearFilters = () => { /* ... logic cập nhật searchParams ... */ };
  const handlePageChange = (newPage) => { /* ... logic cập nhật searchParams ... */ };
  const handleSortChange = (e) => { /* ... logic cập nhật searchParams ... */ };

  const products = data?.products?.items || [];
  const totalProducts = data?.products?.totalCount || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header, Sort, Filter Sidebar, Product Grid, Pagination */}
      {/* ... tương tự như ProductListingPage đã đề xuất ở trên ... */}
      {/* Sử dụng pageTitle prop */}
       <header className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {pageTitle}
        </h1>
        {/* ... Số lượng sản phẩm và Sắp xếp ... */}
      </header>
      <div className="lg:flex lg:space-x-8">
        <div className="w-full lg:w-1/4 xl:w-1/5 mb-8 lg:mb-0">
          <ProductFilter
            currentFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            // Truyền thêm các props filter cố định nếu cần (ví dụ: không cho filter category nếu đã ở trang category)
            // disabledFilters={pageType === 'category' ? ['categories'] : []}
          />
        </div>
        <div className="w-full lg:w-3/4 xl:w-4/5">
          {/* ... ProductGrid và Pagination ... */}
           {loading && products.length === 0 && (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          )}
          {error && (
            <AlertMessage type="error" title={t('products.errorLoadingTitle')} message={error.message} className="mb-6"/>
          )}
          <ProductGrid
            products={products}
            loading={loading && products.length > 0}
          />
          {totalProducts > itemsPerPage && !loading && products.length > 0 && (
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

export default ProductListingPageLayout;