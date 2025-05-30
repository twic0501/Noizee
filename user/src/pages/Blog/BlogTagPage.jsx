// src/pages/Blog/BlogTagPage.jsx
import React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
// import { FiArrowLeft } from 'lucide-react'; // Hoặc react-bootstrap-icons
import { ArrowLeft } from 'react-bootstrap-icons';

import { GET_BLOG_POSTS_QUERY } from '../../api/graphql/blogQueries';
// Nếu bạn có query riêng để lấy chi tiết tag (tên) từ slug:
// import { GET_BLOG_TAG_DETAILS_QUERY } from '../../api/graphql/blogQueries';
import BlogPostCard from '../../components/blog/BlogPostCard';
import BlogSidebar from '../../components/blog/BlogSidebar';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { ITEMS_PER_PAGE_DEFAULT } from '../../utils/constants';

const BlogTagPage = () => {
  const { t, i18n } = useTranslation();
  const { tagSlug } = useParams(); // Lấy tagSlug từ URL
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLang = i18n.language || 'vi';

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = ITEMS_PER_PAGE_DEFAULT;

  // Tùy chọn: Query để lấy tên tag từ slug
  // const { data: tagDetailsData, loading: tagDetailsLoading } = useQuery(
  //   GET_BLOG_TAG_DETAILS_QUERY, // Bạn cần tạo query này
  //   { variables: { slug: tagSlug, lang: currentLang } }
  // );
  // const tagName = tagDetailsData?.blogTagBySlug?.name || tagSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  // const tagId = tagDetailsData?.blogTagBySlug?.id; // Nếu filter theo ID

  // Tạm thời dùng slug làm tên nếu chưa có query lấy chi tiết tag
  const tagNameForDisplay = tagSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Xây dựng biến filter cho GraphQL query
  // Backend của bạn cần hỗ trợ filter theo tagSlug hoặc tagId
  // Giả sử GET_BLOG_POSTS_QUERY có thể nhận tagSlug trong biến filter.
  const gqlFilter = {
    // tagSlug: tagSlug, // Nếu backend hỗ trợ filter trực tiếp bằng slug
    // Hoặc nếu bạn lấy được tagId:
    // tagId: tagId,
  };
  // Hiện tại, GET_BLOG_POSTS_QUERY trong file của bạn nhận tagId, không phải slug.
  // Bạn cần đảm bảo có cách lấy tagId từ tagSlug, hoặc sửa query để nhận slug.
  // Tạm thời, chúng ta sẽ không filter ở đây nếu query không hỗ trợ trực tiếp slug.
  // Ví dụ nếu query nhận `tagId`:
  // const { data: tagDetails } = useQuery(GET_TAG_ID_BY_SLUG_QUERY, { variables: { slug: tagSlug }});
  // const tagIdToFilter = tagDetails?.tag?.id;
  // const gqlFilter = tagIdToFilter ? { tagId: tagIdToFilter } : {};


  const { data, loading, error } = useQuery(GET_BLOG_POSTS_QUERY, {
    variables: {
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
      lang: currentLang,
      // filter: gqlFilter, // Bật lại khi backend và query hỗ trợ
    },
    fetchPolicy: 'cache-and-network',
  });

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo(0,0);
  };

  // Lọc thủ công ở client nếu backend không hỗ trợ filter theo tag slug
  // Đây chỉ là giải pháp tạm thời và không hiệu quả cho dữ liệu lớn.
  const allPosts = data?.blogPosts || [];
  const postsToDisplay = tagSlug
    ? allPosts.filter(post => post.tags?.some(tag => tag.slug === tagSlug))
    : allPosts;
  // const totalPosts = postsToDisplay.length; // Sẽ không chính xác nếu backend có phân trang riêng cho tag

  // Lý tưởng nhất là backend trả về totalCount cho tag này.
  const totalPosts = data?.blogPostsTotalCountForTag || postsToDisplay.length || 0;


  return (
    <div className="container py-4 py-md-5">
      <header className="mb-4">
        <Link to="/blog" className="btn btn-link text-dark text-decoration-none ps-0 mb-2 d-inline-flex align-items-center small">
          <ArrowLeft size={16} className="me-1" />
          {t('blog.backToList', 'Quay lại danh sách Blog')}
        </Link>
        <h1 className="h3 fw-bold text-dark">
          {t('blog.postsInTag', 'Bài viết với thẻ: {{tagName}}', { tagName: tagNameForDisplay })}
        </h1>
        {/* Thông báo nếu filter chưa hoạt động */}
        {/* {!Object.keys(gqlFilter).length && <AlertMessage type="warning" message="Lọc theo thẻ hiện chưa được hỗ trợ đầy đủ từ backend." className="mt-2 small" />} */}
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
            <AlertMessage type="info" message={t('blog.noPostsInTagFound', 'Không tìm thấy bài viết nào với thẻ này.')} />
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

export default BlogTagPage;
