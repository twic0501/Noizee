// admin-frontend/src/components/blog/BlogPostTable.jsx
    // This version does NOT manage its own delete modal.
    // It calls the onDelete prop (from BlogPostListPage) with the full post object.
    import React from 'react';
    import { Table } from 'react-bootstrap';
    import BlogPostRow from './BlogPostRow'; 
    import LoadingSpinner from '../common/LoadingSpinner';
    import { ADMIN_LANGUAGE_KEY } from '../../utils/constants';
    import logger from '../../utils/logger';

    function BlogPostTable({ posts = [], onDelete, isLoading }) {
        const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

        if (isLoading && (!posts || posts.length === 0)) {
            return <LoadingSpinner message="Đang tải bài viết..." />;
        }

        if (!posts || posts.length === 0) {
            return <p className="text-center text-muted my-3">Không có bài viết nào.</p>;
        }

        const handleDeleteClickInternal = (post) => {
            logger.info('BlogPostTable: handleDeleteClickInternal called with post:', post);
            if (onDelete && typeof onDelete === 'function') {
                onDelete(post); // Pass the full post object
            } else {
                logger.warn('BlogPostTable: onDelete prop is not a function or not provided.');
            }
        };

        return (
            <Table striped bordered hover responsive="lg" size="sm" className="blog-post-admin-table shadow-sm">
                <thead className="table-light">
                    <tr>
                        <th style={{ width: '25%' }}>Tiêu đề ({currentAdminLang.toUpperCase()})</th>
                        <th style={{ width: '15%' }}>Tác giả</th>
                        <th style={{ width: '20%' }}>Thẻ</th>
                        <th style={{ width: '15%' }} className="text-center">Ngày xuất bản</th>
                        <th style={{ width: '10%' }} className="text-center">Trạng thái</th>
                        <th style={{ width: '15%' }} className="text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map((post) => (
                        <BlogPostRow
                            key={post.post_id}
                            post={post}
                            onDeleteClick={handleDeleteClickInternal} // Calls internal handler
                            displayLang={currentAdminLang}
                        />
                    ))}
                </tbody>
            </Table>
        );
    }

    export default BlogPostTable;