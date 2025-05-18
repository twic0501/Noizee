// admin-frontend/src/pages/Blog/BlogCommentListPage.jsx
    import React, { useState, useEffect, useCallback } from 'react';
    import { useQuery, useMutation } from '@apollo/client';
    import { Container, Row, Col, Button, Spinner, Breadcrumb, Card, Form, FloatingLabel } from 'react-bootstrap'; // Added Card, Form, FloatingLabel
    import BlogCommentList from '../../components/blog/BlogCommentList'; 
    import Pagination from '../../components/common/Pagination';
    import LoadingSpinner from '../../components/common/LoadingSpinner';
    import AlertMessage from '../../components/common/AlertMessage';
    import { ADMIN_GET_ALL_BLOG_COMMENTS_QUERY } from '../../api/queries/blogCommentQueries';
    import { 
        ADMIN_APPROVE_BLOG_COMMENT_MUTATION, 
        ADMIN_REJECT_BLOG_COMMENT_MUTATION,
        ADMIN_DELETE_BLOG_COMMENT_MUTATION
    } from '../../api/mutations/blogCommentMutations';
    import useDataTable from '../../hooks/useDataTable';
    import logger from '../../utils/logger';
    import { DEFAULT_PAGE_LIMIT } from '../../utils/constants';

    function BlogCommentListPage() {
        const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });
        
        const [currentCommentFilters, setCurrentCommentFilters] = useState({});

        const {
            currentPage, limit, offset, totalItems, totalPages,
            handlePageChange, setTotalItems, applyFilters, // Added applyFilters
        } = useDataTable({ initialLimit: DEFAULT_PAGE_LIMIT, initialFilters: currentCommentFilters });


        const { loading, error, data, refetch } = useQuery(ADMIN_GET_ALL_BLOG_COMMENTS_QUERY, {
            variables: { 
                limit, 
                offset, 
                // Pass filters from useDataTable state
                post_id: filters.post_id ? parseInt(filters.post_id, 10) : undefined,
                filter_status: filters.filter_status || undefined
            },
            fetchPolicy: 'cache-and-network',
            notifyOnNetworkStatusChange: true,
            onCompleted: (queryData) => {
                setTotalItems(queryData?.adminGetAllBlogComments?.count || 0);
            },
            onError: (err) => {
                logger.error("Error fetching blog comments:", err);
                setActionFeedback({ type: 'danger', message: err.message || "Không thể tải danh sách bình luận." });
            }
        });
        
        const handleMutationError = useCallback((err, actionName) => {
            logger.error(`Error ${actionName} comment:`, err);
            const message = err.graphQLErrors?.[0]?.message || err.message || `Thao tác ${actionName} thất bại.`;
            setActionFeedback({ type: 'danger', message });
        }, []);

        useEffect(() => {
            if (actionFeedback.message) {
                const timer = setTimeout(() => setActionFeedback({ type: '', message: '' }), 5000);
                return () => clearTimeout(timer);
            }
        }, [actionFeedback]);

        const [approveComment, { loading: approving }] = useMutation(ADMIN_APPROVE_BLOG_COMMENT_MUTATION, {
            onCompleted: () => { 
                setActionFeedback({ type: 'success', message: 'Bình luận đã được duyệt.'}); 
                refetch();
            },
            onError: (err) => handleMutationError(err, 'duyệt bình luận')
        });
        const [rejectComment, { loading: rejecting }] = useMutation(ADMIN_REJECT_BLOG_COMMENT_MUTATION, {
            onCompleted: () => { 
                setActionFeedback({ type: 'success', message: 'Bình luận đã được từ chối.'});
                refetch();
            },
            onError: (err) => handleMutationError(err, 'từ chối bình luận')
        });
        const [deleteComment, { loading: deleting }] = useMutation(ADMIN_DELETE_BLOG_COMMENT_MUTATION, {
            onCompleted: () => { 
                setActionFeedback({ type: 'success', message: 'Bình luận đã được xóa.'});
                refetch();
                 if (currentPage > 1 && data?.adminGetAllBlogComments?.comments?.length === 1 && totalItems > 1) {
                    handlePageChange(currentPage - 1);
                }
            },
            onError: (err) => handleMutationError(err, 'xóa bình luận')
        });

        const handleFilterChangeAndUpdateQuery = useCallback((newFilters) => {
            setCurrentCommentFilters(newFilters); // Update local filter state
            applyFilters(newFilters); // Update filters in useDataTable, which should trigger useQuery's refetch
            handlePageChange(1); // Reset to page 1
        }, [applyFilters, handlePageChange]);


        const comments = data?.adminGetAllBlogComments?.comments || [];
        const isLoadingOverall = loading || approving || rejecting || deleting;

        return (
            <Container fluid className="p-md-4 p-3">
                <Breadcrumb className="mb-3">
                    <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="/blog/posts">Blog</Breadcrumb.Item>
                    <Breadcrumb.Item active>Bình luận</Breadcrumb.Item>
                </Breadcrumb>
                <Row className="align-items-center mb-3">
                    <Col><h1 className="h3 mb-0 text-dark-blue">Quản lý Bình luận Blog</h1></Col>
                </Row>

                {actionFeedback.message && <AlertMessage variant={actionFeedback.type} dismissible onClose={() => setActionFeedback({type:'', message:''})}>{actionFeedback.message}</AlertMessage>}
                
                {error && !data && <AlertMessage variant="danger">Lỗi tải dữ liệu: {error.message}</AlertMessage>}

                {/* BlogCommentList now receives currentCommentFilters to manage its internal state if needed */}
                <BlogCommentList
                    comments={comments}
                    isLoading={isLoadingOverall}
                    onApprove={(commentId) => approveComment({ variables: { comment_id: commentId }})}
                    onReject={(commentId) => rejectComment({ variables: { comment_id: commentId }})}
                    onDelete={(commentId) => deleteComment({ variables: { comment_id: commentId }})}
                    onFilterChange={handleFilterChangeAndUpdateQuery} // Pass the new handler
                    currentFilters={currentCommentFilters} // Pass current filters to BlogCommentList
                />
                
                {totalItems > 0 && comments.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        className="mt-4 justify-content-center"
                    />
                )}
                {totalItems > 0 && comments.length > 0 && (
                    <div className="text-center text-muted small mt-2">
                        Hiển thị {comments.length} trên tổng số {totalItems} bình luận.
                    </div>
                )}
                 {!loading && !error && totalItems === 0 && (
                     <AlertMessage variant="info" className="mt-3 text-center">Không có bình luận nào khớp với bộ lọc.</AlertMessage>
                )}
            </Container>
        );
    }

    export default BlogCommentListPage;