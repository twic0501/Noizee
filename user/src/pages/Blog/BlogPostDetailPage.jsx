// src/pages/Blog/BlogPostDetailPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
// import { FiArrowLeft, FiCalendar, FiUser, FiTag, FiMessageSquare } from 'lucide-react'; // Hoặc react-bootstrap-icons
import { ArrowLeft, CalendarEvent, Person, Tag, ChatSquareText } from 'react-bootstrap-icons';


import { GET_BLOG_POST_DETAILS_QUERY } from '../../api/graphql/blogQueries';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import OptimizedImage from '../../components/common/OptimizedImage';
import CommentSection from '../../components/blog/CommentSection'; // Cần Bootstrap hóa component này
import { formatDate } from '../../utils/formatters';
import { API_BASE_URL, PRODUCT_IMAGE_PLACEHOLDER } from '../../utils/constants'; // Dùng tạm placeholder của product

const BlogPostDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { postSlug } = useParams();
  const currentLang = i18n.language || 'vi';

  const { data, loading, error } = useQuery(GET_BLOG_POST_DETAILS_QUERY, {
    variables: { slug: postSlug, lang: currentLang }, // Truyền lang nếu query hỗ trợ
    fetchPolicy: 'cache-and-network',
  });

  const post = data?.blogPost;

  if (loading && !data) {
    return (
        <div className="container d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 200px)'}}>
            <LoadingSpinner size="lg" />
        </div>
    );
  }
  if (error) {
    return (
        <div className="container py-4">
            <AlertMessage type="error" title={t('blog.errorLoadingPost')} message={error.message} />
        </div>
    );
  }
  if (!post) {
    return (
        <div className="container py-4">
            <AlertMessage type="info" message={t('blog.postNotFound')} />
        </div>
    );
  }

  const authorName = post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : t('blog.unknownAuthor');
  // Giả sử content là HTML, làm sạch trước khi render
  const cleanHtmlContent = post.content ? DOMPurify.sanitize(post.content) : '';

  const getFullImageUrl = (relativePath) => {
    if (!relativePath) return PRODUCT_IMAGE_PLACEHOLDER; // Hoặc một placeholder riêng cho blog
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('data:')) {
        return relativePath;
    }
    return `${API_BASE_URL}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  };
  const featuredImageUrl = getFullImageUrl(post.featuredImageUrl);


  return (
    <div className="container py-4 py-md-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-7"> {/* Giới hạn chiều rộng cho nội dung chính */}
          {/* Back link */}
          <Link to="/blog" className="btn btn-link text-dark text-decoration-none ps-0 mb-3 d-inline-flex align-items-center small">
            <ArrowLeft size={16} className="me-1" />
            {t('blog.backToList', 'Quay lại danh sách Blog')}
          </Link>

          {/* Post Header */}
          <header className="mb-4">
            <h1 className="h2 fw-bold text-dark mb-2 lh-base">
              {post.title || t('blog.untitledPost')}
            </h1>
            <div className="d-flex flex-wrap align-items-center small text-muted">
              <div className="d-flex align-items-center me-3 mb-1">
                <CalendarEvent size={14} className="me-1" />
                <span>{formatDate(post.publishedAt, undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {post.author && (
                <div className="d-flex align-items-center me-3 mb-1">
                  <Person size={14} className="me-1" />
                  <span>{authorName}</span>
                </div>
              )}
              {/* Số lượng bình luận có thể lấy từ post.comments.length hoặc một trường riêng từ API */}
              <div className="d-flex align-items-center mb-1">
                <ChatSquareText size={14} className="me-1" />
                <span>{post.comments?.length || 0} {t('blog.comments', 'bình luận')}</span>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {featuredImageUrl && featuredImageUrl !== PRODUCT_IMAGE_PLACEHOLDER && ( // Chỉ hiển thị nếu có ảnh thực sự
            <div className="mb-4 rounded overflow-hidden shadow-sm">
              <OptimizedImage
                src={featuredImageUrl}
                alt={post.title || "Ảnh bìa bài viết"}
                containerClassName="w-100" // Cho phép ảnh tự điều chỉnh chiều cao theo tỷ lệ
                imageClassName="img-fluid" // Bootstrap class để ảnh responsive
                // objectFit="object-cover" // Có thể không cần thiết nếu dùng img-fluid và container đúng
                style={{ aspectRatio: '16/9' }} // Giữ tỷ lệ 16:9 cho ảnh bìa
              />
            </div>
          )}

          {/* Post Content */}
          {/* Sử dụng các class của Bootstrap cho typography nếu không dùng Tailwind Typography plugin */}
          <article
            className="blog-content text-dark lh-lg" // Thêm class để tùy chỉnh style nếu cần
            dangerouslySetInnerHTML={{ __html: cleanHtmlContent }}
          />
          {/* Ví dụ CSS cho .blog-content nếu không dùng plugin typography:
              .blog-content p { margin-bottom: 1rem; }
              .blog-content h2 { font-size: 1.75rem; margin-top: 2rem; margin-bottom: 1rem; }
              .blog-content ul, .blog-content ol { padding-left: 2rem; margin-bottom: 1rem; }
              .blog-content blockquote { border-left: 4px solid #ccc; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; }
          */}


          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 pt-4 border-top">
              <h6 className="small fw-semibold text-muted text-uppercase mb-2 d-flex align-items-center">
                <Tag size={14} className="me-1"/>
                {t('blog.tagsTitle', 'Thẻ')}
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Link
                    key={tag.id}
                    to={`/blog/tag/${tag.slug || tag.id}`}
                    className="badge rounded-pill text-bg-light text-decoration-none small fw-normal px-2 py-1" // Badge của Bootstrap
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Author Bio (Optional - Cần dữ liệu tác giả chi tiết hơn) */}
          {/* {post.author && (
              <div className="mt-5 pt-4 border-top d-flex align-items-center">
                  // Avatar tác giả (cần OptimizedImage)
                  <div className="ms-3 small">
                      <p className="fw-semibold text-dark mb-0">{authorName}</p>
                      <p className="text-muted mb-0">Mô tả ngắn về tác giả...</p>
                  </div>
              </div>
          )} */}

          {/* Comment Section */}
          <div className="mt-5">
            <CommentSection postId={post.id} comments={post.comments || []} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostDetailPage;
