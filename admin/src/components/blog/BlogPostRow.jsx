// admin-frontend/src/components/blog/BlogPostRow.jsx
    import React from 'react';
    import { Link } from 'react-router-dom';
    import { Button, Badge } from 'react-bootstrap';
    import { truncateString } from '../../utils/formatters'; 
    import logger from '../../utils/logger';
    import { format, parseISO } from 'date-fns'; // Import date-fns functions

    function BlogPostRow({ post, onDeleteClick, displayLang }) {
        if (!post) return null;

        const title = (displayLang === 'en' && post.title_en) ? post.title_en : post.title_vi;
        const authorName = post.author?.customer_name || 'N/A';
        
        let publishedDate = 'Chưa xuất bản';
        if (post.published_at) {
            try {
                publishedDate = format(parseISO(post.published_at), 'dd/MM/yyyy HH:mm');
            } catch (e) {
                logger.warn(`Invalid date format for post ${post.post_id}: ${post.published_at}`);
                // Keep 'Chưa xuất bản' or set to a raw string
            }
        }


        const handleDelete = () => {
            logger.info('BlogPostRow: Delete button clicked for post:', post);
            if (typeof onDeleteClick === 'function') {
                onDeleteClick(post); 
            } else {
                logger.warn('BlogPostRow: onDeleteClick is not a function or not provided.');
            }
        };

        return (
            <tr>
                <td className="align-middle">
                    <Link to={`/blog/edit/${post.post_id}`} title={title}>
                        {truncateString(title, 70) || 'Không có tiêu đề'}
                    </Link>
                </td>
                <td className="align-middle">{authorName}</td>
                <td className="align-middle">
                    {post.tags && post.tags.length > 0 
                        ? post.tags.slice(0, 3).map(tag => (
                            <Badge pill bg="light" text="dark" key={tag.tag_id} className="me-1 fw-normal">
                               #{(displayLang === 'en' && tag.name_en) ? tag.name_en : tag.name_vi}
                            </Badge>
                          ))
                        : <span className="text-muted">-</span>
                    }
                    {post.tags && post.tags.length > 3 && <small className="text-muted ms-1">...</small>}
                </td>
                <td className="text-center align-middle">{publishedDate}</td>
                <td className="text-center align-middle">
                    <Badge bg={post.status === 'published' ? 'success' : (post.status === 'draft' ? 'secondary' : 'warning')}>
                        {post.status === 'published' ? 'Đã xuất bản' : (post.status === 'draft' ? 'Bản nháp' : post.status)}
                    </Badge>
                </td>
                <td className="text-center align-middle">
                    <Button
                        as={Link}
                        to={`/blog/edit/${post.post_id}`}
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        title="Sửa"
                    >
                        <i className="bi bi-pencil-fill"></i>
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={handleDelete}
                        title="Xóa"
                    >
                        <i className="bi bi-trash-fill"></i>
                    </Button>
                </td>
            </tr>
        );
    }

    export default BlogPostRow;