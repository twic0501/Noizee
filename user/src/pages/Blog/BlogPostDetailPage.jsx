// user/src/pages/Blog/BlogPostDetailPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiCalendar, FiUser, FiTag, FiMessageSquare } from 'react-icons/fi';

import { GET_BLOG_POST_DETAILS_QUERY } from '../../api/graphql/blogQueries'; // API đã đề xuất
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import OptimizedImage from '../../components/common/OptimizedImage';
import CommentSection from '../../components/blog/CommentSection'; // Component đã đề xuất
import { formatDate } from '../../utils/formatters';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../utils/constants'; // Dùng tạm

const BlogPostDetailPage = () => {
  const { t } = useTranslation();
  const { postSlug } = useParams(); // Lấy postSlug từ URL

  const { data, loading, error } = useQuery(GET_BLOG_POST_DETAILS_QUERY, {
    variables: { slug: postSlug }, // Hoặc id: postId nếu bạn dùng ID
    fetchPolicy: 'cache-and-network',
  });

  // Placeholder data
  const placeholderPost = {
    id: 'post1', title: `Chi tiết về: ${postSlug}`, slug: postSlug,
    excerpt: 'Đây là một đoạn tóm tắt ngắn cho bài viết blog mẫu.',
    content: `<p>Nội dung chi tiết của bài viết <strong>${postSlug}</strong>.</p><p>Đây là một đoạn văn bản HTML mẫu. Bạn có thể sử dụng trình soạn thảo WYSIWYG ở admin để tạo nội dung phong phú.</p><ul><li>Mục 1</li><li>Mục 2</li></ul><p>Thêm nhiều nội dung hơn nữa...</p>`,
    featuredImageUrl: `https://picsum.photos/seed/${postSlug}/800/450`,
    publishedAt: new Date().toISOString(),
    author: { firstName: 'Tác giả', lastName: 'Bài viết' },
    tags: [{id: 'tag1', name: 'Demo Tag', slug: 'demo-tag'}],
    comments: [
        {id: 'comment1', content: 'Bình luận mẫu đầu tiên.', createdAt: new Date().toISOString(), author: {firstName: 'Người dùng', lastName: 'A'}},
        {id: 'comment2', content: 'Bình luận mẫu thứ hai.', createdAt: new Date().toISOString(), author: {firstName: 'Người dùng', lastName: 'B'}},
    ]
  };
  const post = data?.blogPost || placeholderPost;


  if (loading && !data) return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner size="xl" /></div>;
  if (error) return <div className="container mx-auto px-4 py-8"><AlertMessage type="error" title={t('blog.errorLoadingPost')} message={error.message} /></div>;
  if (!post) return <div className="container mx-auto px-4 py-8"><AlertMessage type="info" message={t('blog.postNotFound')} /></div>;

  const authorName = post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : t('blog.unknownAuthor');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link to="/blog" className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-6 group">
          <FiArrowLeft className="mr-1 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          {t('blog.backToList', 'Quay lại danh sách Blog')}
        </Link>

        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <FiCalendar className="mr-1.5 h-4 w-4" />
              <span>{formatDate(post.publishedAt, undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            {post.author && (
              <div className="flex items-center">
                <FiUser className="mr-1.5 h-4 w-4" />
                <span>{authorName}</span>
              </div>
            )}
            {/* <div className="flex items-center">
              <FiMessageSquare className="mr-1.5 h-4 w-4" />
              <span>{post.comments?.length || 0} {t('blog.comments', 'bình luận')}</span>
            </div> */}
          </div>
        </header>

        {/* Featured Image */}
        {post.featuredImageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <OptimizedImage
              src={post.featuredImageUrl}
              alt={post.title}
              containerClassName="w-full aspect-video" // aspect-[16/9]
              objectFit="object-cover"
            />
          </div>
        )}

        {/* Post Content */}
        {/* Giả sử content là HTML, sử dụng dangerouslySetInnerHTML. CẨN THẬN VỚI XSS! */}
        {/* Nếu content là Markdown, bạn cần một thư viện để parse (ví dụ: react-markdown) */}
        <article
          className="prose prose-indigo lg:prose-lg xl:prose-xl max-w-none mx-auto text-gray-700" // Tailwind Typography plugin classes
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
              <FiTag className="mr-2 h-4 w-4"/>
              {t('blog.tagsTitle', 'Thẻ')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <Link
                  key={tag.id}
                  to={`/blog/tag/${tag.slug || tag.id}`}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Author Bio (Optional) */}
        {/* {post.author && (
            <div className="mt-10 pt-8 border-t border-gray-200 flex items-center">
                // Avatar tác giả
                <div className="text-sm">
                    <p className="font-semibold text-gray-900">{authorName}</p>
                    <p className="text-gray-600">Mô tả ngắn về tác giả...</p>
                </div>
            </div>
        )} */}

        {/* Comment Section */}
        <CommentSection postId={post.id} comments={post.comments || []} />
      </div>
    </div>
  );
};

export default BlogPostDetailPage;