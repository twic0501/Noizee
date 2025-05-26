// user/src/pages/Blog/BlogListPage.jsx
import React from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom'; // useSearchParams cho filter/phân trang

import { GET_BLOG_POSTS_QUERY } from '../../api/graphql/blogQueries'; // API đã đề xuất
import BlogPostCard from '../../components/blog/BlogPostCard';     // Component đã đề xuất
import BlogSidebar from '../../components/blog/BlogSidebar';       // Component đã đề xuất
import Pagination from '../../components/common/Pagination';         // Component đã đề xuất
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { ITEMS_PER_PAGE_DEFAULT } from '../../utils/constants';

const BlogListPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = ITEMS_PER_PAGE_DEFAULT; // Hoặc một hằng số khác cho blog
  // Lấy các filter khác từ searchParams nếu có (ví dụ: category, tag)
  // const categoryFilter = searchParams.get('category');
  // const tagFilter = searchParams.get('tag');

  const { data, loading, error } = useQuery(GET_BLOG_POSTS_QUERY, {
    variables: {
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
      // categoryId: categoryFilter, // Hoặc categorySlug tùy backend
      // tagId: tagFilter,           // Hoặc tagSlug tùy backend
    },
    fetchPolicy: 'cache-and-network',
  });

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo(0, 0);
  };
  
  // Dữ liệu từ API (sử dụng placeholder nếu chưa có)
  // const posts = data?.blogPosts?.posts || data?.blogPosts || [];
  // const totalPosts = data?.blogPosts?.totalCount || 0;
  const placeholderPosts = Array.from({ length: 5 }).map((_, i) => ({
    id: `post${i+1}`,
    title: `Tiêu đề bài viết mẫu ${i+1}`,
    slug: `tieu-de-bai-viet-mau-${i+1}`,
    excerpt: 'Đây là một đoạn tóm tắt ngắn cho bài viết blog mẫu để minh họa giao diện người dùng. Nội dung chi tiết sẽ có khi bạn nhấp vào để xem đầy đủ.',
    featuredImageUrl: `https://picsum.photos/seed/blog${i+1}/600/400`,
    publishedAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    author: { firstName: 'Người Viết', lastName: 'Ẩn Danh' },
    tags: [{id: `tag${i}`, name: `Tag ${i+1}`, slug: `tag-${i+1}`}]
  }));
  const posts = data?.blogPosts || placeholderPosts;
  const totalPosts = data?.blogPostsTotalCount || placeholderPosts.length * 2; // Giả sử có nhiều hơn

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          {t('blog.pageTitle', 'Bài viết & Tin tức')}
        </h1>
        <p className="mt-2 text-md text-gray-600">
          {t('blog.pageSubtitle', 'Khám phá những chia sẻ, kiến thức và cập nhật mới nhất từ chúng tôi.')}
        </p>
      </header>

      <div className="lg:flex lg:space-x-8">
        {/* Main Content: Blog Post Grid */}
        <div className="lg:w-3/4 xl:w-4/5">
          {loading && !data && (
            <div className="flex justify-center items-center py-20">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {posts.map(post => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {totalPosts > itemsPerPage && (
            <div className="mt-12">
              <Pagination
                currentPage={currentPage}
                totalItems={totalPosts}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="mt-12 lg:mt-0 lg:w-1/4 xl:w-1/5">
          <BlogSidebar />
        </div>
      </div>
    </div>
  );
};

export default BlogListPage;