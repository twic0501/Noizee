import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';

const CommentForm = ({ postId, parentCommentId, onSubmit, loading, error, clearError }) => {
  const { t } = useTranslation();
  const { authState } = useAuth();
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setFormError(t('blog.commentCannotBeEmpty', 'Bình luận không được để trống.'));
      return;
    }
    if (!authState.isAuthenticated) {
        setFormError(t('blog.loginToComment', 'Vui lòng đăng nhập để bình luận.'));
        return;
    }
    onSubmit({ postId, content, parentCommentId }); // parentCommentId có thể là null
    setContent(''); // Clear form sau khi submit
    setFormError('');
    if(clearError) clearError();
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    if (formError) setFormError('');
    if (clearError) clearError();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <div>
        <label htmlFor="commentContent" className="sr-only">
          {t('blog.yourComment', 'Bình luận của bạn')}
        </label>
        <textarea
          id="commentContent"
          name="commentContent"
          rows="3"
          value={content}
          onChange={handleChange}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
          placeholder={authState.isAuthenticated ? t('blog.writeCommentPlaceholder', 'Viết bình luận của bạn...') : t('blog.loginToCommentPlaceholder', 'Đăng nhập để viết bình luận...')}
          disabled={!authState.isAuthenticated || loading}
        />
        {formError && <p className="mt-1 text-xs text-red-500">{formError}</p>}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
      <div className="flex justify-end">
        {authState.isAuthenticated ? (
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="xs" color="text-white" className="mr-2"/> : null}
            {t('blog.postCommentButton', 'Gửi bình luận')}
          </button>
        ) : (
          <p className="text-sm text-gray-600">
            {t('blog.please', 'Vui lòng')} <Link to="/login" state={{ from: location.pathname }} className="font-medium text-indigo-600 hover:text-indigo-500">{t('auth.loginButton', 'đăng nhập')}</Link> {t('blog.toComment', 'để bình luận.')}
          </p>
        )}
      </div>
    </form>
  );
};

export default CommentForm;