// admin-frontend/src/components/blog/BlogCommentList.jsx
    import React, { useState, useEffect } from 'react'; // Added useEffect
    import { ListGroup, Button, Badge, Card, Row, Col, Form, FloatingLabel } from 'react-bootstrap'; // Added Card, Form, FloatingLabel
    import { format, parseISO } from 'date-fns';
    import ModalConfirm from '../common/ModalConfirm';
    import LoadingSpinner from '../common/LoadingSpinner';
    import logger from '../../utils/logger';

    function BlogCommentItem({ comment, onApprove, onReject, onDelete }) { // Removed onReply for now
        const authorName = comment.author?.customer_name || comment.author?.username || 'Guest';
        const [showDeleteModal, setShowDeleteModal] = useState(false);

        const handleDelete = () => {
            if (onDelete) {
                onDelete(comment.comment_id, `comment by ${authorName}`);
            }
            setShowDeleteModal(false);
        };
        
        const getStatusBadge = (status) => {
            switch (status) {
                case 'approved': return <Badge bg="success">Đã duyệt</Badge>;
                case 'pending_approval': return <Badge bg="warning" text="dark">Chờ duyệt</Badge>;
                case 'rejected': return <Badge bg="danger">Đã từ chối</Badge>;
                case 'spam': return <Badge bg="dark">Spam</Badge>;
                default: return <Badge bg="light" text="dark">{status || 'Không rõ'}</Badge>;
            }
        };
        
        let displayPostTitle = 'Không rõ bài viết';
        if (comment.post) {
            displayPostTitle = comment.post.title_vi || comment.post.title_en || `ID ${comment.post.post_id}`;
        }


        return (
            <ListGroup.Item className="mb-2 p-3 border rounded shadow-sm comment-item">
                <Row>
                    <Col>
                        <p className="mb-1">
                            <strong>{authorName}</strong> 
                            {comment.parent_comment_id && <small className="text-muted"> (trả lời bình luận #{comment.parent_comment_id})</small>}
                            <span className="ms-2">{getStatusBadge(comment.status)}</span>
                        </p>
                        <p className="mb-1 fst-italic comment-content" style={{whiteSpace: "pre-wrap"}}>{comment.content}</p>
                        <small className="text-muted">
                            Ngày: {comment.created_at ? format(parseISO(comment.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                            {comment.post && <span className="ms-2">| Bài viết: {displayPostTitle}</span>}
                        </small>
                    </Col>
                    <Col xs="auto" className="d-flex flex-column flex-md-row align-items-md-center justify-content-end action-buttons">
                        {comment.status !== 'approved' && onApprove && (
                            <Button variant="outline-success" size="sm" onClick={() => onApprove(comment.comment_id)} className="mb-1 mb-md-0 me-md-1" title="Duyệt">
                                <i className="bi bi-check-circle"></i> <span className="d-none d-md-inline">Duyệt</span>
                            </Button>
                        )}
                        {comment.status !== 'rejected' && comment.status !== 'spam' && onReject && (
                            <Button variant="outline-warning" size="sm" onClick={() => onReject(comment.comment_id)} className="mb-1 mb-md-0 me-md-1" title="Từ chối">
                                <i className="bi bi-x-circle"></i> <span className="d-none d-md-inline">Từ chối</span>
                            </Button>
                        )}
                        {onDelete && (
                            <Button variant="outline-danger" size="sm" onClick={() => setShowDeleteModal(true)} title="Xóa">
                                <i className="bi bi-trash"></i> <span className="d-none d-md-inline">Xóa</span>
                            </Button>
                        )}
                    </Col>
                </Row>
                <ModalConfirm
                    show={showDeleteModal}
                    handleClose={() => setShowDeleteModal(false)}
                    handleConfirm={handleDelete}
                    title="Xác nhận Xóa Bình luận"
                    body={`Bạn có chắc chắn muốn xóa bình luận này của "${authorName}"?`}
                    confirmButtonText="Xóa"
                    confirmButtonVariant="danger"
                />
            </ListGroup.Item>
        );
    }


    function BlogCommentList({ comments = [], isLoading, onApprove, onReject, onDelete, onFilterChange, currentFilters = {} }) {
        // Internal state for filter inputs, initialized from currentFilters prop
        const [postIdFilter, setPostIdFilter] = useState(currentFilters.post_id || '');
        const [statusFilter, setStatusFilter] = useState(currentFilters.filter_status || '');

        // Effect to update internal filter state if currentFilters prop changes from parent
        useEffect(() => {
            setPostIdFilter(currentFilters.post_id || '');
            setStatusFilter(currentFilters.filter_status || '');
        }, [currentFilters]);


        const handleFilterSubmit = (e) => {
            e.preventDefault();
            logger.info("BlogCommentList: Submitting filters - Post ID:", postIdFilter, "Status:", statusFilter);
            if (onFilterChange) {
                onFilterChange({
                    post_id: postIdFilter ? parseInt(postIdFilter, 10) : undefined,
                    filter_status: statusFilter || undefined,
                });
            }
        };
        
        const handleResetFilters = () => {
            setPostIdFilter('');
            setStatusFilter('');
            if (onFilterChange) {
                onFilterChange({});
            }
        }

        if (isLoading && (!comments || comments.length === 0)) {
            return <LoadingSpinner message="Đang tải bình luận..." />;
        }

        return (
            <Card className="shadow-sm">
                <Card.Header>
                    <Form onSubmit={handleFilterSubmit}>
                        <Row className="g-2 align-items-end">
                            <Col md={4} sm={6} xs={12}>
                                <FloatingLabel controlId="postIdFilter" label="Lọc theo ID Bài viết">
                                    <Form.Control
                                        type="number"
                                        placeholder="Nhập ID bài viết"
                                        value={postIdFilter}
                                        onChange={(e) => setPostIdFilter(e.target.value)}
                                    />
                                </FloatingLabel>
                            </Col>
                            <Col md={4} sm={6} xs={12}>
                                <FloatingLabel controlId="statusFilter" label="Lọc theo Trạng thái">
                                    <Form.Select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="pending_approval">Chờ duyệt</option>
                                        <option value="approved">Đã duyệt</option>
                                        <option value="rejected">Đã từ chối</option>
                                        <option value="spam">Spam</option>
                                    </Form.Select>
                                </FloatingLabel>
                            </Col>
                            <Col md={2} sm={6} xs={12} className="d-flex align-self-stretch">
                                <Button type="submit" variant="primary" className="w-100">Lọc</Button>
                            </Col>
                             <Col md={2} sm={6} xs={12} className="d-flex align-self-stretch">
                                <Button type="button" variant="outline-secondary" className="w-100" onClick={handleResetFilters}>Reset</Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Header>
                <Card.Body>
                    {(!comments || comments.length === 0) && !isLoading ? (
                        <p className="text-center text-muted my-3">Không tìm thấy bình luận nào khớp.</p>
                    ) : (
                        <ListGroup variant="flush">
                            {comments.map(comment => (
                                <BlogCommentItem
                                    key={comment.comment_id}
                                    comment={comment}
                                    onApprove={onApprove}
                                    onReject={onReject}
                                    onDelete={onDelete}
                                />
                            ))}
                        </ListGroup>
                    )}
                </Card.Body>
            </Card>
        );
    }

    export default BlogCommentList;