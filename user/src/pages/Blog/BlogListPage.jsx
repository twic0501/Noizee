// src/pages/Blog/BlogListPage.jsx
import React from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import { GET_BLOG_POSTS_QUERY } from '../../api/graphql/blogQueries';
import BlogPostCard from '../../components/blog/BlogPostCard';
import BlogSidebar from '../../components/blog/BlogSidebar'; // Giả sử BlogSidebar cũng sẽ được Bootstrap hóa
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { ITEMS_PER_PAGE_DEFAULT } from '../../utils/constants';

const BlogListPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLang = i18n.language || 'vi';

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = ITEMS_PER_PAGE_DEFAULT; // Hoặc một hằng số khác cho blog

  // Lấy các filter khác từ searchParams nếu có (ví dụ: category, tag)
  const categorySlugFilter = searchParams.get('category'); // Ví dụ
  const tagSlugFilter = searchParams.get('tag'); // Ví dụ


  // Xây dựng biến filter cho GraphQL query
  const gqlFilter = {};
  if (categorySlugFilter) {
    // Giả sử backend filter theo category slug, nếu theo ID thì cần lấy ID từ slug trước
    // gqlFilter.categorySlug = categorySlugFilter; // Hoặc category_id nếu backend yêu cầu
    // Tạm thời comment out vì GET_BLOG_POSTS_QUERY hiện tại không có filter theo slug
  }
  if (tagSlugFilter) {
    // gqlFilter.tagSlug = tagSlugFilter; // Hoặc tag_id
  }


  const { data, loading, error } = useQuery(GET_BLOG_POSTS_QUERY, {
    variables: {
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
      lang: currentLang, // Truyền ngôn ngữ nếu query hỗ trợ
      // filter: gqlFilter, // Truyền filter nếu có và query hỗ trợ
      // sortBy: 'publishedAt', // Ví dụ: Sắp xếp theo ngày xuất bản
      // sortOrder: 'DESC',     // Mới nhất lên trước
    },
    fetchPolicy: 'cache-and-network',
  });

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo(0, 0);
  };

  const posts = data?.blogPosts || []; // Giả sử query trả về mảng blogPosts trực tiếp
                                        // Hoặc data?.blogPosts?.posts nếu có cấu trúc lồng nhau
  const totalPosts = data?.blogPostsTotalCount || data?.blogPosts?.length || 0; // Cần totalCount từ backend để phân trang chính xác

  return (
    <div className="container py-4 py-md-5"> {/* Sử dụng container của Bootstrap */}
      <header className="mb-4 mb-md-5 text-center">
        <h1 className="h2 fw-bold text-dark">
          {t('blog.pageTitle', 'Bài viết & Tin tức')}
        </h1>
        <p className="lead text-muted small">
          {t('blog.pageSubtitle', 'Khám phá những chia sẻ, kiến thức và cập nhật mới nhất từ chúng tôi.')}
        </p>
      </header>

      <div className="row g-4 g-lg-5">
        {/* Main Content: Blog Post Grid */}
        <div className="col-lg-8 col-xl-9">
          {loading && !data && ( // Chỉ hiển thị loading ban đầu
            <div className="d-flex justify-content-center align-items-center py-5">
              <LoadingSpinner size="lg" />
            </div>
          )}
          {error && (
            <AlertMessage type="error" title={t('blog.errorLoadingTitle')} message={error.message} />
          )}
          {!loading && !error && posts.length === 0 && (
            <AlertMessage type="info" message={t('blog.noPostsFound')} />
          )}

          {posts.length > 0 && (
            <div className="row row-cols-1 row-cols-md-2 g-4"> {/* Grid của Bootstrap */}
              {posts.map(post => (
                <div key={post.id} className="col d-flex align-items-stretch"> {/* d-flex và align-items-stretch để các card bằng chiều cao */}
                  <BlogPostCard post={post} /> {/* BlogPostCard cần được Bootstrap hóa */}
                </div>
              ))}
            </div>
          )}

          {totalPosts > itemsPerPage && !loading && posts.length > 0 && (
            <div className="mt-4 pt-4 border-top">
              <Pagination
                currentPage={currentPage}
                totalItems={totalPosts}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                className="justify-content-center" // Căn giữa pagination
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-lg-4 col-xl-3">
          <BlogSidebar /> {/* BlogSidebar cũng cần được Bootstrap hóa */}
        </div>
      </div>
    </div>
  );
};

export default BlogListPage;
