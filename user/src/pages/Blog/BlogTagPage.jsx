// user/src/pages/Blog/BlogTagPage.jsx
import React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';

import { GET_BLOG_POSTS_QUERY } from '../../api/graphql/blogQueries';
// import { GET_BLOG_TAG_DETAILS_QUERY } from '../../api/graphql/blogQueries'; // Query để lấy tên tag
import BlogPostCard from '../../components/blog/BlogPostCard';
import BlogSidebar from '../../components/blog/BlogSidebar';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { ITEMS_PER_PAGE_DEFAULT } from '../../utils/constants';
import { FiArrowLeft } from 'react-icons/fi';

const BlogTagPage = () => {
  const { t } = useTranslation();
  const { tagSlug } = useParams(); // Lấy tagSlug từ URL
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = ITEMS_PER_PAGE_DEFAULT;

  // (Tùy chọn) Fetch thông tin chi tiết của tag để hiển thị tên tag
  // const { data: tagDetailsData, loading: tagDetailsLoading } = useQuery(GET_BLOG_TAG_DETAILS_QUERY, {
  //   variables: { slug: tagSlug },
  // });
  // const tagName = tagDetailsLoading ? t('common.loading', 'Đang tải...') : (tagDetailsData?.blogTag?.name || tagSlug);
  
  // Tạm thời dùng slug làm tên nếu chưa có query lấy chi tiết tag
  const tagNameForTitle = tagSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const { data, loading, error } = useQuery(GET_BLOG_POSTS_QUERY, {
    variables: {
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
      filter: { // Đảm bảo cấu trúc filter này khớp với ProductFilterInput của backend
        tag_slug: tagSlug // Sử dụng snake_case nếu API của bạn là snake_case
      }
    },
    fetchPolicy: 'cache-and-network',
  });

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo(0,0);
  };

  // Dữ liệu từ API (sử dụng placeholder nếu chưa có)
  const placeholderPosts = Array.from({ length: 2 }).map((_, i) => ({ 
    id: `tagpost${i+1}`, 
    title: `Bài viết mẫu với thẻ ${tagNameForTitle} - ${i+1}`, 
    slug: `bai-viet-mau-the-${tagSlug}-${i+1}`,
    excerpt: `Nội dung tóm tắt cho bài viết thuộc thẻ ${tagNameForTitle}.`,
    featuredImageUrl: `https://picsum.photos/seed/tagblog${i+1}/600/400`,
    publishedAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    author: { firstName: 'Tác giả Tag', lastName: '' },
    tags: [{id: `tag${i}`, name: tagNameForTitle, slug: tagSlug}]
  }));
  
  const posts = data?.blogPosts?.posts || data?.blogPosts || placeholderPosts; // Điều chỉnh dựa trên cấu trúc trả về của GET_BLOG_POSTS_QUERY
  const totalPosts = data?.blogPosts?.totalCount || data?.blogPosts?.count || placeholderPosts.length; // Điều chỉnh dựa trên cấu trúc trả về


  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <Link to="/blog" className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-2 group">
          <FiArrowLeft className="mr-1 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          {t('blog.backToList', 'Quay lại danh sách Blog')}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {t('blog.postsInTag', 'Bài viết với thẻ: {{tagName}}', { tagName: tagNameForTitle })}
        </h1>
      </header>

      <div className="lg:flex lg:space-x-8">
        <div className="lg:w-3/4 xl:w-4/5">
          {loading && !data && <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>}
          {error && <AlertMessage type="error" title={t('blog.errorLoadingTitle')} message={error.message} />}
          {!loading && !error && posts.length === 0 && (
            <AlertMessage type="info" message={t('blog.noPostsInTagFound', 'Không tìm thấy bài viết nào với thẻ này.')} />
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
        <div className="mt-12 lg:mt-0 lg:w-1/4 xl:w-1/5">
          <BlogSidebar />
        </div>
      </div>
    </div>
  );
};

export default BlogTagPage;