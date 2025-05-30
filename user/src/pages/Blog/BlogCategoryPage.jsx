// src/pages/Blog/BlogCategoryPage.jsx
import React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
// import { FiArrowLeft } from 'lucide-react'; // Hoặc react-bootstrap-icons
import { ArrowLeft } from 'react-bootstrap-icons';

import { GET_BLOG_POSTS_QUERY } from '../../api/graphql/blogQueries';
// Nếu bạn có query riêng để lấy chi tiết category (tên, mô tả) từ slug:
// import { GET_BLOG_CATEGORY_DETAILS_QUERY } from '../../api/graphql/blogQueries';
import BlogPostCard from '../../components/blog/BlogPostCard';
import BlogSidebar from '../../components/blog/BlogSidebar';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { ITEMS_PER_PAGE_DEFAULT } from '../../utils/constants';

const BlogCategoryPage = () => {
  const { t, i18n } = useTranslation();
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLang = i18n.language || 'vi';

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = ITEMS_PER_PAGE_DEFAULT;

  // Tùy chọn: Query để lấy tên danh mục từ slug
  // const { data: categoryDetailsData, loading: categoryDetailsLoading } = useQuery(
  //   GET_BLOG_CATEGORY_DETAILS_QUERY, // Bạn cần tạo query này
  //   { variables: { slug: categorySlug, lang: currentLang } }
  // );
  // const categoryName = categoryDetailsData?.blogCategoryBySlug?.name || categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  // const categoryId = categoryDetailsData?.blogCategoryBySlug?.id; // Nếu filter theo ID

  // Tạm thời dùng slug làm tên nếu chưa có query lấy chi tiết category
  const categoryNameForDisplay = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());


  // Xây dựng biến filter cho GraphQL query
  // Backend của bạn cần hỗ trợ filter theo categorySlug hoặc categoryId
  // Ví dụ, nếu backend filter theo categoryId, bạn cần lấy categoryId từ categorySlug trước.
  // Giả sử GET_BLOG_POSTS_QUERY có thể nhận categorySlug trong biến filter.
  const gqlFilter = {
    // categorySlug: categorySlug, // Nếu backend hỗ trợ filter trực tiếp bằng slug
    // Hoặc nếu bạn lấy được categoryId:
    // categoryId: categoryId,
  };
  // Hiện tại, GET_BLOG_POSTS_QUERY trong file của bạn nhận categoryId, không phải slug.
  // Bạn cần đảm bảo có cách lấy categoryId từ categorySlug, hoặc sửa query để nhận slug.
  // Tạm thời, chúng ta sẽ không filter ở đây nếu query không hỗ trợ trực tiếp slug.
  // Bạn cần điều chỉnh logic này cho phù hợp với backend.
  // Ví dụ nếu query nhận `categoryId`:
  // const { data: categoryDetails } = useQuery(GET_CATEGORY_ID_BY_SLUG_QUERY, { variables: { slug: categorySlug }});
  // const categoryIdToFilter = categoryDetails?.category?.id;
  // const gqlFilter = categoryIdToFilter ? { categoryId: categoryIdToFilter } : {};


  const { data, loading, error } = useQuery(GET_BLOG_POSTS_QUERY, {
    variables: {
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
      lang: currentLang,
      // filter: gqlFilter, // Bật lại khi backend và query hỗ trợ
      // Tạm thời, nếu không filter được, trang này sẽ hiển thị tất cả bài viết
      // và bạn cần thông báo cho người dùng rằng filter theo category chưa hoạt động.
      // Hoặc, bạn có thể filter ở client-side sau khi fetch tất cả (không khuyến khích cho dữ liệu lớn).
    },
    fetchPolicy: 'cache-and-network',
  });

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo(0,0);
  };

  // Lọc thủ công ở client nếu backend không hỗ trợ filter theo category slug
  // Đây chỉ là giải pháp tạm thời và không hiệu quả cho dữ liệu lớn.
  const allPosts = data?.blogPosts || [];
  const postsToDisplay = categorySlug
    ? allPosts.filter(post => post.category?.slug === categorySlug || post.categories?.some(cat => cat.slug === categorySlug))
    : allPosts;
  // const totalPosts = postsToDisplay.length; // Sẽ không chính xác nếu backend có phân trang riêng cho category

  // Lý tưởng nhất là backend trả về totalCount cho category này.
  const totalPosts = data?.blogPostsTotalCountForCategory || postsToDisplay.length || 0;


  return (
    <div className="container py-4 py-md-5">
      <header className="mb-4">
        <Link to="/blog" className="btn btn-link text-dark text-decoration-none ps-0 mb-2 d-inline-flex align-items-center small">
          <ArrowLeft size={16} className="me-1" />
          {t('blog.backToList', 'Quay lại danh sách Blog')}
        </Link>
        <h1 className="h3 fw-bold text-dark">
          {t('blog.postsInCategory', 'Bài viết trong chuyên mục: {{categoryName}}', { categoryName: categoryNameForDisplay })}
        </h1>
        {/* Thông báo nếu filter chưa hoạt động */}
        {/* {!Object.keys(gqlFilter).length && <AlertMessage type="warning" message="Lọc theo danh mục hiện chưa được hỗ trợ đầy đủ từ backend." className="mt-2 small" />} */}
      </header>

      <div className="row g-4 g-lg-5">
        <div className="col-lg-8 col-xl-9">
          {loading && !data && (
            <div className="d-flex justify-content-center align-items-center py-5">
                <LoadingSpinner size="lg" />
            </div>
          )}
          {error && <AlertMessage type="error" title={t('blog.errorLoadingTitle')} message={error.message} />}
          {!loading && !error && postsToDisplay.length === 0 && (
            <AlertMessage type="info" message={t('blog.noPostsInCategoryFound', 'Không tìm thấy bài viết nào trong chuyên mục này.')} />
          )}

          {postsToDisplay.length > 0 && (
            <div className="row row-cols-1 row-cols-md-2 g-4">
              {postsToDisplay.map(post => (
                <div key={post.id} className="col d-flex align-items-stretch">
                  <BlogPostCard post={post} /> {/* BlogPostCard cần được Bootstrap hóa */}
                </div>
              ))}
            </div>
          )}

          {totalPosts > itemsPerPage && !loading && postsToDisplay.length > 0 && (
            <div className="mt-4 pt-4 border-top">
              <Pagination
                currentPage={currentPage}
                totalItems={totalPosts}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                className="justify-content-center"
              />
            </div>
          )}
        </div>
        <div className="col-lg-4 col-xl-3">
          <BlogSidebar /> {/* BlogSidebar cần được Bootstrap hóa */}
        </div>
      </div>
    </div>
  );
};

export default BlogCategoryPage;
