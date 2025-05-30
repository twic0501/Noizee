import React from 'react';

const CommentItem = ({ comment }) => {
    return <div>Comment: {comment?.content || 'A comment'} (Placeholder)</div>;
};
export default CommentItem;