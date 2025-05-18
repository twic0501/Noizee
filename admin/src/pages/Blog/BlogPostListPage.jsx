    // admin-frontend/src/pages/Blog/BlogPostListPage.jsx
    import React, { useState, useEffect, useCallback } from 'react';
    import { useQuery, useMutation } from '@apollo/client';
    import { Link, useLocation, useNavigate } from 'react-router-dom';
    // SỬA LỖI: Thêm Card, Spinner vào import
    import { Container, Button, Row, Col, Breadcrumb, Form, InputGroup, Card, Spinner, FloatingLabel } from 'react-bootstrap'; 
    import BlogPostTable from '../../components/blog/BlogPostTable';
    import Pagination from '../../components/common/Pagination';
    import LoadingSpinner from '../../components/common/LoadingSpinner';
    import AlertMessage from '../../components/common/AlertMessage';
    import ModalConfirm from '../../components/common/ModalConfirm';
    import { ADMIN_GET_ALL_BLOG_POSTS_QUERY } from '../../api/queries/blogPostQueries';
    import { ADMIN_GET_ALL_BLOG_TAGS_QUERY } from '../../api/queries/blogTagQueries';
    import { ADMIN_DELETE_BLOG_POST_MUTATION } from '../../api/mutations/blogPostMutations';
    import useDataTable from '../../hooks/useDataTable';
    import logger from '../../utils/logger';
    import { DEFAULT_PAGE_LIMIT, ADMIN_LANGUAGE_KEY } from '../../utils/constants';

    function BlogPostListPage() {
        const location = useLocation();
        const navigate = useNavigate();
        const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || null);
        const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

        const [blogFilters, setBlogFilters] = useState({
            status: '', 
            tag_slug: '',
            search_term: '',
        });

        // Sử dụng blogFilters làm initialFilters cho useDataTable
        const {
            currentPage, limit, offset, filters, totalItems, totalPages,
            handlePageChange, applyFilters: applyTableFilters, resetFilters: resetTableFilters, setTotalItems,
        } = useDataTable({ 
            initialLimit: DEFAULT_PAGE_LIMIT, 
            initialFilters: blogFilters 
        });
        
        const [showDeleteModal, setShowDeleteModal] = useState(false);
        const [postToDelete, setPostToDelete] = useState(null);
        const [actionError, setActionError] = useState(null);

        const { data: tagsData, loading: tagsLoading } = useQuery(ADMIN_GET_ALL_BLOG_TAGS_QUERY, {
            variables: { lang: currentAdminLang }
        });
        const availableTagsForFilter = tagsData?.adminGetAllBlogTags || [];

        // Truyền `filters` từ useDataTable (đã được cập nhật bởi applyTableFilters) vào query
        const { loading, error, data, refetch } = useQuery(ADMIN_GET_ALL_BLOG_POSTS_QUERY, {
            variables: { limit, offset, filter: filters, lang: currentAdminLang },
            fetchPolicy: 'cache-and-network',
            notifyOnNetworkStatusChange: true,
            onCompleted: (queryData) => {
                setTotalItems(queryData?.adminGetAllBlogPosts?.count || 0);
            },
            onError: (err) => {
                logger.error("Error fetching blog posts:", err);
                setActionError(err.message || "Không thể tải danh sách bài viết.");
            }
        });

        const [deleteBlogPost, { loading: deleting }] = useMutation(ADMIN_DELETE_BLOG_POST_MUTATION, {
            onCompleted: (mutationData) => {
                if (mutationData.adminDeleteBlogPost) {
                    const displayTitle = (currentAdminLang === 'en' && postToDelete?.title_en) ? postToDelete.title_en : postToDelete?.title_vi;
                    setSuccessMessage(`Bài viết "${displayTitle || 'ID: ' + postToDelete?.post_id}" đã được xóa!`);
                    setActionError(null);
                    refetch();
                    if (currentPage > 1 && data?.adminGetAllBlogPosts?.posts?.length === 1 && totalItems > 1) {
                        handlePageChange(currentPage - 1);
                    }
                } else {
                    setActionError('Xóa bài viết thất bại.');
                    setSuccessMessage(null);
                }
                setPostToDelete(null);
            },
            onError: (err) => {
                logger.error("Error deleting blog post:", err);
                setActionError(err.graphQLErrors?.[0]?.message || err.message || 'Xóa bài viết thất bại.');
                setSuccessMessage(null);
                setPostToDelete(null);
            },
        });
        
        // Cập nhật filters của useDataTable khi blogFilters thay đổi
        useEffect(() => {
            applyTableFilters(blogFilters);
        }, [blogFilters, applyTableFilters]);


        useEffect(() => {
            if (successMessage) {
                const timer = setTimeout(() => {
                    setSuccessMessage(null);
                    if (location.state?.successMessage) {
                        navigate(location.pathname, { replace: true, state: {} });
                    }
                }, 5000);
                return () => clearTimeout(timer);
            }
        }, [successMessage, location.pathname, location.state, navigate]);

        const handleDeleteRequest = (post) => {
            setPostToDelete(post); // BlogPostTable sẽ truyền toàn bộ object 'post'
            setShowDeleteModal(true);
            setActionError(null);
            setSuccessMessage(null);
        };

        const confirmDeleteHandler = () => {
            if (postToDelete?.post_id) {
                deleteBlogPost({ variables: { id: postToDelete.post_id } });
            }
            setShowDeleteModal(false);
        };
        
        const handleFilterInputChange = (e) => {
            const { name, value } = e.target;
            setBlogFilters(prev => ({ ...prev, [name]: value }));
        };

        const handleApplyBlogFilters = () => {
            // applyTableFilters sẽ được gọi bởi useEffect ở trên
            handlePageChange(1); // Reset về trang 1 khi áp dụng filter mới
            // refetch() sẽ được gọi tự động bởi useQuery khi biến `filters` (từ useDataTable) thay đổi
            // Hoặc có thể gọi refetch thủ công nếu cần:
            // refetch({ limit, offset: 0, filter: blogFilters, lang: currentAdminLang });
        };

        const handleResetBlogFilters = () => {
            setBlogFilters({ status: '', tag_slug: '', search_term: '' });
            // applyTableFilters({}); // Cập nhật filters của useDataTable
            handlePageChange(1);
            // refetch(); // Kích hoạt refetch với filter trống
        };


        return (
            <Container fluid className="p-md-4 p-3">
                <Breadcrumb className="mb-3">
                    <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item active>Blog</Breadcrumb.Item>
                    <Breadcrumb.Item active>Bài viết</Breadcrumb.Item>
                </Breadcrumb>
                <Row className="align-items-center mb-3">
                    <Col><h1 className="h3 mb-0 text-dark-blue">Quản lý Bài viết Blog</h1></Col>
                    <Col xs="auto">
                        <Link to="/blog/posts/new">
                            <Button variant="primary" className="shadow-sm">
                                <i className="bi bi-plus-lg me-1"></i> Tạo Bài viết mới
                            </Button>
                        </Link>
                    </Col>
                </Row>

                <Card className="p-3 mb-3 border rounded bg-light shadow-sm">
                    <Form onSubmit={(e) => { e.preventDefault(); handleApplyBlogFilters();}}>
                        <Row className="g-3 align-items-end">
                            <Col md={4} sm={6} xs={12}>
                                <FloatingLabel controlId="blogSearchTerm" label="Tìm kiếm tiêu đề">
                                    <Form.Control
                                        type="text"
                                        name="search_term"
                                        placeholder="Nhập tiêu đề bài viết..."
                                        value={blogFilters.search_term}
                                        onChange={handleFilterInputChange}
                                    />
                                </FloatingLabel>
                            </Col>
                            <Col md={3} sm={6} xs={12}>
                                <FloatingLabel controlId="blogStatusFilter" label="Trạng thái">
                                    <Form.Select
                                        name="status"
                                        value={blogFilters.status}
                                        onChange={handleFilterInputChange}
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="published">Đã xuất bản</option>
                                        <option value="draft">Bản nháp</option>
                                        <option value="archived">Đã lưu trữ</option>
                                    </Form.Select>
                                </FloatingLabel>
                            </Col>
                            <Col md={3} sm={6} xs={12}>
                                <FloatingLabel controlId="blogTagFilter" label="Thẻ">
                                    <Form.Select
                                        name="tag_slug"
                                        value={blogFilters.tag_slug}
                                        onChange={handleFilterInputChange}
                                        disabled={tagsLoading}
                                    >
                                        <option value="">Tất cả thẻ</option>
                                        {availableTagsForFilter.map(tag => (
                                            <option key={tag.tag_id} value={tag.slug}>
                                                {(currentAdminLang === 'en' && tag.name_en) ? tag.name_en : tag.name_vi}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </FloatingLabel>
                            </Col>
                            <Col md={2} sm={6} xs={12} className="d-flex align-items-stretch">
                                <Button variant="primary" type="submit" className="w-100 me-2">Lọc</Button>
                                <Button variant="outline-secondary" onClick={handleResetBlogFilters} className="w-100">Reset</Button>
                            </Col>
                        </Row>
                    </Form>
                </Card>


                {successMessage && <AlertMessage variant="success" dismissible onClose={() => setSuccessMessage(null)}>{successMessage}</AlertMessage>}
                {actionError && <AlertMessage variant="danger" dismissible onClose={() => setActionError(null)}>{actionError}</AlertMessage>}

                {loading && (!data?.adminGetAllBlogPosts?.posts || data.adminGetAllBlogPosts.posts.length === 0) && <LoadingSpinner message="Đang tải bài viết..." />}
                {error && <AlertMessage variant="danger">Lỗi tải bài viết: {error.message}</AlertMessage>}

                {data?.adminGetAllBlogPosts?.posts && (
                     <>
                        <BlogPostTable
                            posts={data.adminGetAllBlogPosts.posts}
                            onDelete={handleDeleteRequest} // Truyền hàm xử lý xóa từ page này
                            isLoading={loading || deleting}
                        />
                        {totalItems > 0 && data.adminGetAllBlogPosts.posts.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                className="mt-4 justify-content-center"
                            />
                        )}
                         {totalItems > 0 && data.adminGetAllBlogPosts.posts.length > 0 && (
                            <div className="text-center text-muted small mt-2">
                                Hiển thị {data.adminGetAllBlogPosts.posts.length} trên tổng số {totalItems} bài viết.
                            </div>
                        )}
                    </>
                )}
                {!loading && !error && totalItems === 0 && (
                    <AlertMessage variant="info" className="mt-3 text-center">
                        Không tìm thấy bài viết nào. Thử điều chỉnh bộ lọc hoặc <Link to="/blog/posts/new">tạo bài viết mới</Link>.
                    </AlertMessage>
                )}

                <ModalConfirm
                    show={showDeleteModal}
                    handleClose={() => { setShowDeleteModal(false); setPostToDelete(null);}}
                    handleConfirm={confirmDeleteHandler}
                    title="Xác nhận Xóa Bài viết"
                    body={`Bạn có chắc chắn muốn xóa bài viết "${
                        (currentAdminLang === 'en' && postToDelete?.title_en ? postToDelete.title_en : postToDelete?.title_vi) || 'này'
                    }"? Hành động này không thể hoàn tác.`}
                    confirmButtonText={deleting ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Đang xóa...</> : 'Xóa'}
                    confirmButtonVariant="danger"
                    confirmDisabled={deleting}
                />
            </Container>
        );
    }

    export default BlogPostListPage;