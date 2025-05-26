import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client';
// import { GET_BLOG_CATEGORIES_QUERY, GET_BLOG_TAGS_QUERY } from '../../api/graphql/blogQueries';
// Tạm thời comment out các query này vì chưa chắc chắn backend có hỗ trợ không
// Bạn cần un-comment và đảm bảo query đúng nếu backend có
import LoadingSpinner from '../common/LoadingSpinner';

const SidebarSection = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
      {title}
    </h3>
    {children}
  </div>
);

const BlogSidebar = () => {
  const { t } = useTranslation();

  // TODO: Fetch categories and tags. Ví dụ:
  // const { data: categoriesData, loading: categoriesLoading } = useQuery(GET_BLOG_CATEGORIES_QUERY);
  // const { data: tagsData, loading: tagsLoading } = useQuery(GET_BLOG_TAGS_QUERY);

  // Placeholder data
  const categoriesData = { blogCategories: [
    { id: '1', name: 'Công nghệ', slug: 'cong-nghe', postCount: 5 },
    { id: '2', name: 'Thời trang', slug: 'thoi-trang', postCount: 8 },
  ]};
  const categoriesLoading = false;

  const tagsData = { blogTags: [
    { id: '1', name: 'React', slug: 'react', postCount: 3 },
    { id: '2', name: 'JavaScript', slug: 'javascript', postCount: 7 },
    { id: '3', name: 'TailwindCSS', slug: 'tailwindcss', postCount: 2 },
  ]};
  const tagsLoading = false;


  // TODO: Fetch recent posts (có thể cần một query mới hoặc dùng GetBlogPosts với limit nhỏ)

  return (
    <aside className="w-full lg:w-1/4 xl:w-1/5 space-y-8">
      {/* Search Bar (optional) */}
      {/* <SidebarSection title={t('blog.search')}>
        <form>
          <input type="text" placeholder={t('blog.searchPlaceholder', "Tìm kiếm bài viết...")} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"/>
        </form>
      </SidebarSection> */}

      {/* Categories */}
      <SidebarSection title={t('blog.categories', 'Danh mục')}>
        {categoriesLoading ? <LoadingSpinner size="sm"/> : (
          <ul className="space-y-1.5">
            {categoriesData?.blogCategories?.map(category => (
              <li key={category.id}>
                <Link
                  to={`/blog/category/${category.slug || category.id}`}
                  className="text-sm text-gray-600 hover:text-indigo-600 hover:underline flex justify-between"
                >
                  <span>{category.name}</span>
                  {typeof category.postCount === 'number' && <span className="text-gray-400">({category.postCount})</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SidebarSection>

      {/* Tags */}
      <SidebarSection title={t('blog.tags', 'Thẻ')}>
        {tagsLoading ? <LoadingSpinner size="sm"/> : (
          <div className="flex flex-wrap gap-2">
            {tagsData?.blogTags?.map(tag => (
              <Link
                key={tag.id}
                to={`/blog/tag/${tag.slug || tag.id}`}
                className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </SidebarSection>
      
      {/* Recent Posts (optional) */}
      {/* <SidebarSection title={t('blog.recentPosts', 'Bài viết gần đây')}>
         // ... logic để hiển thị recent posts ...
      </SidebarSection> */}
    </aside>
  );
};

export default BlogSidebar;