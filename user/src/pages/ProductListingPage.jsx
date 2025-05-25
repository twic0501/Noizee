// src/pages/ProductListingPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
// Giả sử bạn có hook useTranslation từ react-i18next hoặc tương tự
import { useTranslation } from 'react-i18next';

import ProductCard from '../../components/product/ProductCard';
import ProductFilter from '../../components/product/ProductFilter';
import Pagination from '../../components/common/Pagination'; // Import component Pagination
import AlertMessage from '../../components/common/AlertMessage';
// import LoadingSpinner from '../../components/common/LoadingSpinner'; // Có thể dùng Skeleton thay thế

// --- GraphQL Queries ---
// Query này nên được import từ file .gql của bạn
// Ví dụ: import { GET_PRODUCTS_QUERY, GET_PRODUCT_FILTERS_DATA_QUERY } from '../../services/graphql/productQueries';

// Sử dụng GET_PRODUCTS_QUERY từ phiên bản 2 (đã cung cấp)
const GET_PRODUCTS_QUERY = gql`
  query GetProducts(
    $filter: ProductFilterInput
    $limit: Int
    $offset: Int
    $lang: String
  ) {
    products(filter: $filter, limit: $limit, offset: $offset, lang: $lang) {
      count
      products {
        product_id
        name(lang: $lang)
        product_price
        is_new_arrival
        images(limit: 1, color_id: null) {
          image_id
          image_url
          alt_text(lang: $lang)
        }
        # Thêm các trường khác nếu cần cho ProductCard
        # Ví dụ: colors { color_id, name, hex_code }
      }
    }
  }
`;

// GET_PRODUCT_FILTERS_DATA_QUERY cần được định nghĩa hoặc import
// Đây là một ví dụ giả định dựa trên cách sử dụng trong code của bạn:
const GET_PRODUCT_FILTERS_DATA_QUERY = gql`
  query GetProductFiltersData($lang: String) {
    categories(lang: $lang) { # Giả sử query categories trả về list các category
      category_id
      name
      slug
      # ... các trường khác
    }
    collections(lang: $lang) { # Giả sử query collections trả về list các collection
      collection_id
      name
      slug
      # ... các trường khác
    }
    publicGetAllColors(lang: $lang) { # Tên query có thể khác
      color_id
      name
      hex_code
      # ... các trường khác
    }
    sizes(lang: $lang) { # Giả sử query sizes trả về list các size
      size_id
      name
      # ... các trường khác
    }
    # Thêm các query khác cho filter nếu cần, ví dụ: priceRanges
  }
`;

const ITEMS_PER_PAGE = 12;

// Component Skeleton cho Product Card khi đang tải
const SkeletonProductCard = () => (
  <div className="group flex flex-col bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden animate-pulse">
    <div className="relative w-full aspect-[3/4] bg-gray-200"></div>
    <div className="p-3 md:p-4 flex flex-col flex-grow">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2 mb-3"></div>
      <div className="flex space-x-1.5 mb-3 min-h-[24px]">
        <div className="w-5 h-5 rounded-full bg-gray-300"></div>
        <div className="w-5 h-5 rounded-full bg-gray-300"></div>
        <div className="w-5 h-5 rounded-full bg-gray-300"></div>
      </div>
      <div className="h-5 bg-gray-300 rounded w-1/3 mt-auto pt-1"></div>
    </div>
  </div>
);


const ProductListingPage = () => {
  // const { t, i18n } = useTranslation(); // Hook i18n
  // const lang = i18n.language; // Lấy ngôn ngữ hiện tại
  const t = (key, fallback) => fallback || key; // Giả lập hàm t() nếu chưa có i18n
  const lang = 'vi'; // Hoặc lấy từ context/i18n

  const location = useLocation();
  const params = useParams(); // Để lấy route params (ví dụ: /collections/:collectionSlug)
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState({});

  // Effect để khởi tạo và đồng bộ filter, page từ URL (query params và route params)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    let initialFilters = {};

    // Ưu tiên lấy filter từ query params
    for (const [key, value] of queryParams.entries()) {
      if (key !== 'page' && value) {
        initialFilters[key] = value;
      }
    }
    
    // TODO: Xử lý route params (ví dụ: params.categorySlugOrId, params.collectionSlug)
    // Bạn cần logic để chuyển slug thành ID nếu API yêu cầu ID.
    // Ví dụ:
    // if (params.categorySlugOrId && !initialFilters.category_id) {
    //   // const categoryId = await getCategoryIdFromSlug(params.categorySlugOrId); // Cần hàm này
    //   // if (categoryId) initialFilters.category_id = categoryId;
    //   console.log("Lọc theo category từ route:", params.categorySlugOrId);
    // }
    // if (params.collectionSlug && !initialFilters.collection_id) {
    //   // const collectionId = await getCollectionIdFromSlug(params.collectionSlug); // Cần hàm này
    //   // if (collectionId) initialFilters.collection_id = collectionId;
    //   console.log("Lọc theo collection từ route:", params.collectionSlug);
    // }
    // Nếu route params được dùng để thiết lập filter, cần đảm bảo URL được cập nhật tương ứng.

    setActiveFilters(initialFilters);
    setCurrentPage(parseInt(queryParams.get('page') || '1', 10));
  }, [location.search, params]);


  // Query để lấy dữ liệu cho các bộ lọc
  const { data: filterOptionsData, loading: filtersLoading, error: filtersError } = useQuery(GET_PRODUCT_FILTERS_DATA_QUERY, {
    variables: { lang },
  });

  // Query chính để lấy sản phẩm
  const { loading, error, data } = useQuery(GET_PRODUCTS_QUERY, {
    variables: {
      filter: {
        ...activeFilters,
        is_active: true, // Chỉ lấy sản phẩm active
      },
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
      lang: lang,
    },
    // fetchPolicy: "cache-and-network", // Cân nhắc chính sách fetch
  });

  // Xử lý thay đổi filter từ component ProductFilter và cập nhật URL
  const handleFilterChange = (newAppliedFilters) => {
    const queryParams = new URLSearchParams();
    const cleanFilters = Object.entries(newAppliedFilters).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    Object.entries(cleanFilters).forEach(([key, value]) => {
      queryParams.set(key, String(value)); // Chuyển value sang string để đảm bảo
    });

    // Luôn reset về trang 1 khi filter thay đổi và thêm vào queryParams
    queryParams.set('page', '1');
    
    navigate({ search: queryParams.toString() }, { replace: true });
  };

  // Xử lý thay đổi trang từ component Pagination và cập nhật URL
  const handlePageChange = (newPage) => {
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('page', String(newPage));
    navigate({ search: queryParams.toString() });
    // Có thể thêm cuộn lên đầu trang nếu muốn
    // window.scrollTo(0, 0);
  };

  const productData = data?.products;
  const totalProducts = productData?.count || 0;
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  // Chuẩn bị dữ liệu cho component ProductFilter
  const availableFiltersForComponent = {
    // Đảm bảo các key khớp với cấu trúc ProductFilter mong đợi
    categories: filterOptionsData?.categories || [],
    collections: filterOptionsData?.collections || [],
    colors: filterOptionsData?.publicGetAllColors || [], // Key này khớp với query mẫu
    sizes: filterOptionsData?.sizes || [],
    // Thêm các loại filter khác nếu có, ví dụ:
    // priceRanges: filterOptionsData?.priceRanges || [],
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
      {/* Có thể thêm Breadcrumb ở đây */}
      <h1 className="text-2xl sm:text-3xl font-bold my-4 sm:my-6 text-center text-gray-800">
        {t('productListingPage.title', 'Sản Phẩm')}
      </h1>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar Filter */}
        <div className="w-full lg:w-1/4 lg:max-w-xs xl:max-w-sm flex-shrink-0">
          {filtersLoading && (
            <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200 animate-pulse">
              {/* Skeleton cho filter */}
              <div className="h-8 bg-gray-300 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2 w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2 w-2/3"></div>
              <div className="h-8 bg-gray-300 rounded mt-6 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
            </div>
          )}
          {filtersError && <AlertMessage type="error" message={t('productFilter.errorLoadingFilters', 'Lỗi tải bộ lọc.')} />}
          {!filtersLoading && !filtersError && filterOptionsData && (
            <ProductFilter
              availableFilters={availableFiltersForComponent}
              currentFilters={activeFilters} // Truyền activeFilters đã được đồng bộ từ URL
              onFilterChange={handleFilterChange}
              // isLoadingExternally={filtersLoading} // Có thể không cần nếu ProductFilter có skeleton riêng
            />
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-grow min-w-0">
          {loading && ( // Chỉ hiển thị skeleton khi đang fetch products (data chưa có)
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-6">
              {[...Array(ITEMS_PER_PAGE)].map((_, i) => <SkeletonProductCard key={`skeleton-${i}`} />)}
            </div>
          )}
          {error && <AlertMessage type="error" message={`${t('productGrid.errorLoading', 'Lỗi tải sản phẩm')}: ${error.message}`} />}

          {productData && productData.products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-6">
                {productData.products.map((product) => (
                  <ProductCard key={product.product_id} product={product} lang={lang} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 sm:mt-10 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : (
            !loading && !error && <AlertMessage type="info" message={t('productGrid.noProductsFound', 'Không tìm thấy sản phẩm nào.')} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListingPage;