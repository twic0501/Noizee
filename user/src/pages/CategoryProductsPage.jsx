// user/src/pages/CategoryProductsPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Giả sử bạn đã tạo ProductListingPageLayout.jsx để tái sử dụng logic hiển thị danh sách sản phẩm
import ProductListingPageLayout from './ProductListingPageLayout'; // Điều chỉnh đường dẫn nếu cần
// Hoặc nếu không dùng layout chung, bạn sẽ import các thành phần như ProductFilter, ProductGrid, Pagination, GET_PRODUCTS_QUERY, etc.
// và viết lại logic tương tự như trong ProductListingPage.jsx nhưng có thêm filter theo categorySlug.

// API Query để lấy thông tin chi tiết của category (tên, mô tả) - Cần tạo nếu muốn hiển thị
// import { GET_CATEGORY_DETAILS_QUERY } from '../../api/graphql/categoryQueries'; // Ví dụ

const CategoryProductsPage = () => {
  const { categorySlug } = useParams(); // Lấy categorySlug từ URL
  const { t } = useTranslation();

  // (Tùy chọn) Fetch thông tin chi tiết của category để hiển thị tên category thay vì chỉ slug
  // const { data: categoryDetailsData, loading: categoryDetailsLoading } = useQuery(GET_CATEGORY_DETAILS_QUERY, {
  //   variables: { slug: categorySlug },
  // });
  // const categoryName = categoryDetailsLoading ? t('common.loading', 'Đang tải...') : (categoryDetailsData?.category?.name || categorySlug);
  
  // Tạm thời dùng slug làm tên nếu chưa có query lấy chi tiết category
  const categoryNameForTitle = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());


  // Biến này sẽ được truyền vào ProductListingPageLayout (hoặc dùng trực tiếp trong query nếu không dùng layout chung)
  // để ProductListingPageLayout biết cần filter sản phẩm theo categorySlug này.
  // Tên field (categorySlug) phải khớp với những gì ProductFilterInput của bạn ở backend mong đợi.
  const filterVariablesForQuery = { category_slug: categorySlug }; // Sử dụng snake_case nếu API của bạn là snake_case

  // Nếu bạn không tạo ProductListingPageLayout.jsx, bạn sẽ copy toàn bộ logic
  // từ ProductListingPage.jsx vào đây và điều chỉnh biến `queryVariables`
  // trong useQuery(GET_PRODUCTS_QUERY) để thêm filter theo categorySlug.
  // Ví dụ:
  // const { data, loading, error } = useQuery(GET_PRODUCTS_QUERY, {
  //   variables: {
  //     limit: itemsPerPage,
  //     offset: (currentPage - 1) * itemsPerPage,
  //     sortBy: sortBy,
  //     sortOrder: sortOrder,
  //     filter: {
  //       ...activeFilters, // Các filter khác từ URL
  //       category_slug: categorySlug, // Filter theo category
  //     },
  //   },
  //   fetchPolicy: 'cache-and-network',
  // });


  return (
    <ProductListingPageLayout
      pageType="category" // Để ProductListingPageLayout biết đây là trang category
      filterVariablesForQuery={filterVariablesForQuery}
      pageTitle={t('products.productsInCategory', 'Sản phẩm trong danh mục: {{categoryName}}', { categoryName: categoryNameForTitle })}
      // breadcrumbItems={[
      //   { name: t('header.home'), path: '/' },
      //   { name: t('header.categories'), path: '/categories' }, // Giả sử có trang /categories
      //   { name: categoryNameForTitle, path: `/categories/${categorySlug}` }
      // ]}
    />
  );
};

export default CategoryProductsPage;