import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/formatters';
import { FiUser, FiClock } from 'react-icons/fi';
// import OptimizedImage from '../common/OptimizedImage'; // Nếu avatar từ URL

const CommentItem = ({ comment }) => {
  const { t } = useTranslation();
  const authorName = comment.author ? `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim() : t('blog.unknownAuthor', 'Ẩn danh');

  return (
    <div className="py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {/* Avatar Placeholder hoặc OptimizedImage nếu có avatarUrl */}
          <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-semibold">
            {authorName.charAt(0).toUpperCase()}
          </div>
          {/* <OptimizedImage src={comment.author?.avatarUrl || AVATAR_PLACEHOLDER} alt={authorName} containerClassName="w-8 h-8 rounded-full" /> */}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">{authorName}</p>
            <p className="text-xs text-gray-400 flex items-center">
              <FiClock className="mr-1 h-3 w-3" />
              {formatDate(comment.createdAt, undefined, {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
            </p>
          </div>
          <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{comment.content}</p>
          {/* TODO: Reply button, edit/delete buttons if user is author or admin */}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;