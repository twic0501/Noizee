import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/formatters';
import OptimizedImage from '../common/OptimizedImage';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../utils/constants'; // Dùng tạm placeholder của product
import { FiCalendar, FiUser, FiMessageSquare, FiTag } from 'react-icons/fi';

const BlogPostCard = ({ post }) => {
  const { t } = useTranslation();

  if (!post) return null;

  const postLink = post.slug ? `/blog/${post.slug}` : (post.id ? `/blog/post/${post.id}` : '#');
  const authorName = post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : t('blog.unknownAuthor', 'Ẩn danh');

  return (
    <article className="bg-white rounded-lg shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl flex flex-col">
      {post.featuredImageUrl && (
        <Link to={postLink} className="block">
          <OptimizedImage
            src={post.featuredImageUrl}
            alt={post.title || 'Blog post image'}
            containerClassName="w-full aspect-video" // Hoặc aspect-[16/9]
            objectFit="object-cover"
            className="w-full h-full"
            placeholderSrc={PRODUCT_IMAGE_PLACEHOLDER} // Cần placeholder riêng cho blog nếu có
          />
        </Link>
      )}
      <div className="p-5 md:p-6 flex flex-col flex-grow">
        {/* Tags (nếu có) */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map(tag => ( // Hiển thị tối đa 3 tags
              <Link
                key={tag.id}
                to={`/blog/tag/${tag.slug || tag.id}`}
                className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full hover:bg-indigo-200 transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 hover:text-indigo-600 transition-colors">
          <Link to={postLink} className="line-clamp-2">
            {post.title || t('blog.untitledPost', 'Bài viết không có tiêu đề')}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <FiCalendar className="mr-1.5 h-4 w-4" />
              <span>{post.publishedAt ? formatDate(post.publishedAt, undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
            </div>
            {post.author && (
              <div className="flex items-center truncate ml-3">
                <FiUser className="mr-1.5 h-4 w-4" />
                <span className="truncate">{authorName}</span>
              </div>
            )}
            {/* {typeof post.commentCount === 'number' && (
              <div className="flex items-center">
                <FiMessageSquare className="mr-1.5 h-4 w-4" />
                <span>{post.commentCount}</span>
              </div>
            )} */}
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogPostCard;