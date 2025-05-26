// user/src/pages/Blog/BlogCategoryPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';

import { GET_BLOG_POSTS_QUERY } from '../../api/graphql/blogQueries';
// import { GET_BLOG_CATEGORY_DETAILS_QUERY } from '../../api/graphql/blogQueries'; // Query để lấy tên category
import BlogPostCard from '../../components/blog/BlogPostCard';
import BlogSidebar from '../../components/blog/BlogSidebar';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { ITEMS_PER_PAGE_DEFAULT } from '../../utils/constants';
import { FiArrowLeft } from 'react-icons/fi';


const BlogCategoryPage = () => {
  const { t } = useTranslation();
  const { categorySlug } = useParams(); // Lấy categorySlug từ URL
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = ITEMS_PER_PAGE_DEFAULT;

  // TODO: Query để lấy thông tin category (tên, mô tả) dựa trên categorySlug
  // const { data: categoryData, loading: categoryLoading } = useQuery(GET_BLOG_CATEGORY_DETAILS_QUERY, {
  //   variables: { slug: categorySlug }
  // });
  // const categoryName = categoryData?.blogCategory?.name || categorySlug;
  const categoryName = categorySlug; // Placeholder

  const { data, loading, error } = useQuery(GET_BLOG_POSTS_QUERY, {
    variables: {
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
      categorySlug: categorySlug, // Truyền categorySlug (hoặc categoryId tùy backend)
    },
    fetchPolicy: 'cache-and-network',
  });

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo(0,0);
  };

  const placeholderPosts = Array.from({ length: 3 }).map((_, i) => ({ /* ... placeholder post data ... */ id: `catpost${i}`}));
  const posts = data?.blogPosts || placeholderPosts;
  const totalPosts = data?.blogPostsTotalCount || placeholderPosts.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <Link to="/blog" className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-2 group">
          <FiArrowLeft className="mr-1 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          {t('blog.backToList', 'Quay lại danh sách Blog')}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {t('blog.postsInCategory', 'Bài viết trong danh mục: {{categoryName}}', { categoryName: categoryName })}
        </h1>
      </header>

      <div className="lg:flex lg:space-x-8">
        <div className="lg:w-3/4 xl:w-4/5">
          {loading && !data && <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>}
          {error && <AlertMessage type="error" title={t('blog.errorLoadingTitle')} message={error.message} />}
          {!loading && !error && posts.length === 0 && (
            <AlertMessage type="info" message={t('blog.noPostsInCategoryFound', 'Không tìm thấy bài viết nào trong danh mục này.')} />
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

export default BlogCategoryPage;