// user/src/pages/ProductListingPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { GET_PRODUCTS_QUERY } from '../../api/graphql/productQueries'; // API đã đề xuất
import ProductFilter from '../../components/product/ProductFilter';     // Component đã tạo/đề xuất
import ProductGrid from '../../components/product/ProductGrid';         // Component đã tạo/đề xuất
import Pagination from '../../components/common/Pagination';             // Component đã tạo/đề xuất
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { ITEMS_PER_PAGE_DEFAULT } from '../../utils/constants';
// import Breadcrumbs from '../../components/common/Breadcrumbs'; // Nếu có

const ProductListingPage = ({
  pageType = 'all', // 'all', 'collection', 'category'
  slug, // collectionSlug hoặc categorySlug (nếu pageType là 'collection' hoặc 'category')
  pageTitleKey, // i18n key cho tiêu đề trang (ví dụ: 'products.allProductsTitle')
  pageTitleDefault, // Text mặc định cho tiêu đề
}) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Trạng thái filter từ URL query params
  const initialFilters = useMemo(() => {
    const params = {};
    // Ví dụ: ?category=ao-thun&size=M&minPrice=100000&maxPrice=500000&sortBy=price&sortOrder=asc
    // Bạn cần định nghĩa các key filter mà bạn muốn hỗ trợ
    if (searchParams.get('categories')) params.categories = searchParams.get('categories').split(',');
    if (searchParams.get('collections')) params.collections = searchParams.get('collections').split(',');
    if (searchParams.get('colors')) params.colors = searchParams.get('colors').split(',');
    if (searchParams.get('sizes')) params.sizes = searchParams.get('sizes').split(',');
    if (searchParams.get('minPrice') || searchParams.get('maxPrice')) {
      params.priceRange = {
        min: parseInt(searchParams.get('minPrice') || '0', 10),
        max: parseInt(searchParams.get('maxPrice') || '100000000', 10), // Giá trị max lớn
      };
    }
    // Thêm các filter khác nếu cần: brand, ratings, etc.
    return params;
  }, [searchParams]);

  const [activeFilters, setActiveFilters] = useState(initialFilters);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE_DEFAULT), 10);
  const sortBy = searchParams.get('sortBy') || 'createdAt'; // Mặc định sắp xếp theo mới nhất
  const sortOrder = searchParams.get('sortOrder') || 'DESC'; // Mặc định DESC

  const queryVariables = {
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    sortBy: sortBy,
    sortOrder: sortOrder,
    filter: { // Đây là ProductFilterInput mà backend mong đợi
      // Truyền các filter đã được chọn
      // Backend cần xử lý các slug/id này
      ...(pageType === 'collection' && slug && { collectionSlug: slug }),
      ...(pageType === 'category' && slug && { categorySlug: slug }),
      ...(activeFilters.categories?.length && { categoryIds: activeFilters.categories }), // Hoặc categorySlugs
      ...(activeFilters.collections?.length && { collectionIds: activeFilters.collections }), // Hoặc collectionSlugs
      ...(activeFilters.colors?.length && { colorIds: activeFilters.colors }),
      ...(activeFilters.sizes?.length && { sizeIds: activeFilters.sizes }),
      ...(activeFilters.priceRange && { 
          minPrice: activeFilters.priceRange.min, 
          maxPrice: activeFilters.priceRange.max 
      }),
      // searchTerm: searchParams.get('q') // Nếu có search
    },
  };

  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS_QUERY, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Cập nhật URL khi filter thay đổi từ ProductFilter component
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
    params.set('page', '1'); // Reset về trang 1 khi filter
    if(sortBy) params.set('sortBy', sortBy);
    if(sortOrder) params.set('sortOrder', sortOrder);
    setSearchParams(params);
  };
  
  const handleClearFilters = () => {
    setActiveFilters({});
    const params = new URLSearchParams();
    params.set('page', '1');
    if(sortBy) params.set('sortBy', sortBy);
    if(sortOrder) params.set('sortOrder', sortOrder);
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
    params.set('sortBy', newSortBy);
    params.set('sortOrder', newSortOrder);
    params.set('page', '1'); // Reset về trang 1 khi sort
    setSearchParams(params);
  };


  const products = data?.products?.items || [];
  const totalProducts = data?.products?.totalCount || 0;
  
  const pageTitle = pageTitleKey ? t(pageTitleKey, pageTitleDefault || "Sản phẩm") : pageTitleDefault || t('products.allProductsTitle', "Tất cả sản phẩm");


  // Breadcrumbs (ví dụ)
  // const breadcrumbItems = [
  //   { name: t('header.home'), path: '/' },
  //   pageType === 'collection' && slug ? { name: t('header.collections'), path: '/collections' } : null,
  //   pageType === 'category' && slug ? { name: t('header.categories'), path: '/categories' } : null,
  //   { name: pageTitle, path: location.pathname }
  // ].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* <Breadcrumbs items={breadcrumbItems} /> */}
      <header className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {pageTitle}
        </h1>
        {/* Hiển thị số lượng sản phẩm và tùy chọn sắp xếp */}
        <div className="mt-4 md:flex md:items-center md:justify-between text-sm text-gray-600">
            <p>
                {loading ? t('products.loadingProducts', 'Đang tải sản phẩm...') : 
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
                >
                    <option value="createdAt_DESC">{t('products.sort.newest', 'Mới nhất')}</option>
                    <option value="price_ASC">{t('products.sort.priceLowToHigh', 'Giá: Thấp đến Cao')}</option>
                    <option value="price_DESC">{t('products.sort.priceHighToLow', 'Giá: Cao đến Thấp')}</option>
                    <option value="name_ASC">{t('products.sort.nameAZ', 'Tên: A-Z')}</option>
                    <option value="name_DESC">{t('products.sort.nameZA', 'Tên: Z-A')}</option>
                    {/* <option value="popularity_DESC">{t('products.sort.popularity', 'Phổ biến nhất')}</option> */}
                </select>
            </div>
        </div>
      </header>

      <div className="lg:flex lg:space-x-8">
        {/* Filters Sidebar (Mobile: có thể là off-canvas hoặc accordion) */}
        <div className="w-full lg:w-1/4 xl:w-1/5 mb-8 lg:mb-0">
          {/* TODO: Nút để toggle filter trên mobile */}
          <ProductFilter
            currentFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Main Content: Product Grid and Pagination */}
        <div className="w-full lg:w-3/4 xl:w-4/5">
          {loading && products.length === 0 && ( // Hiển thị loading khi chưa có data
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          )}
          {error && (
            <AlertMessage type="error" title={t('products.errorLoadingTitle')} message={error.message} className="mb-6"/>
          )}
          
          <ProductGrid
            products={products}
            loading={loading && products.length > 0} // Chỉ loading cho grid nếu đã có data cũ
            // error={error} // error đã xử lý ở trên
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

export default ProductListingPage;