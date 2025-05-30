import React from 'react';
// import { Link } from 'react-router-dom';

const BlogPostCard = ({ post }) => {
    // Hiển thị tóm tắt một bài viết
    return <div>Blog Post Card: {post?.title || 'Post Title'} (Placeholder)</div>;
};
export default BlogPostCard;