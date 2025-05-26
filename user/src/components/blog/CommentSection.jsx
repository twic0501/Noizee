import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { CREATE_BLOG_COMMENT_MUTATION } from '../../api/graphql/blogMutations';
import { GET_BLOG_POST_DETAILS_QUERY } from '../../api/graphql/blogQueries'; // Để refetch hoặc update cache
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import AlertMessage from '../common/AlertMessage';

const CommentSection = ({ postId, comments = [] }) => {
  const { t } = useTranslation();

  const [createComment, { loading, error, reset: clearError }] = useMutation(CREATE_BLOG_COMMENT_MUTATION, {
    // Cập nhật cache Apollo sau khi thêm comment thành công
    update: (cache, { data: { createBlogComment: newComment } }) => {
      try {
        const existingData = cache.readQuery({
          query: GET_BLOG_POST_DETAILS_QUERY,
          variables: { id: postId }, // Hoặc slug nếu bạn dùng slug
        });

        if (existingData && existingData.blogPost) {
          cache.writeQuery({
            query: GET_BLOG_POST_DETAILS_QUERY,
            variables: { id: postId }, // Hoặc slug
            data: {
              blogPost: {
                ...existingData.blogPost,
                comments: [newComment, ...(existingData.blogPost.comments || [])],
              },
            },
          });
        }
      } catch (e) {
        console.warn("Failed to update comment cache:", e);
        // Có thể cần refetchQueries nếu writeQuery phức tạp hoặc thất bại
      }
    },
    // Hoặc đơn giản là refetch query bài viết để cập nhật comments
    // refetchQueries: [{ query: GET_BLOG_POST_DETAILS_QUERY, variables: { id: postId } }],
    onError: (err) => {
        // Lỗi đã được set vào biến error
        console.error("Error creating comment:", err);
    }
  });

  const handleCommentSubmit = async (commentData) => {
    // commentData = { postId, content, parentCommentId? }
    try {
      await createComment({ variables: { input: commentData } });
    } catch (e) {
      // Lỗi đã được xử lý bởi onError của useMutation
    }
  };

  return (
    <div className="mt-10 pt-8 border-t border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        {t('blog.commentsTitle', 'Bình luận')} ({comments?.length || 0})
      </h3>

      {/* Form để thêm bình luận mới */}
      <CommentForm
        postId={postId}
        onSubmit={handleCommentSubmit}
        loading={loading}
        error={error?.message}
        clearError={clearError}
      />

      {/* Danh sách bình luận */}
      <div className="mt-8 space-y-6">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
            // TODO: Xử lý bình luận lồng nhau (replies) nếu có
          ))
        ) : (
          !loading && <p className="text-sm text-gray-500">{t('blog.noCommentsYet', 'Chưa có bình luận nào.')}</p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;