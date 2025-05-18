// admin-frontend/src/pages/Blog/BlogPostEditPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Breadcrumb } from 'react-bootstrap';
import BlogPostForm from '../../components/blog/BlogPostForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { ADMIN_GET_BLOG_POST_BY_ID_QUERY, ADMIN_GET_ALL_BLOG_POSTS_QUERY } from '../../api/queries/blogPostQueries';
import { ADMIN_UPDATE_BLOG_POST_MUTATION } from '../../api/mutations/blogPostMutations';
import logger from '../../utils/logger';
import { DEFAULT_PAGE_LIMIT, ADMIN_LANGUAGE_KEY } from '../../utils/constants';

function BlogPostEditPage() {
    const { id: postId } = useParams(); // Lấy ID bài viết từ URL
    const navigate = useNavigate();
    const [submitError, setSubmitError] = useState(null);
    const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

    const { loading: queryLoading, error: queryError, data: postQueryResult, refetch: refetchPostDetails } = useQuery(ADMIN_GET_BLOG_POST_BY_ID_QUERY, {
        variables: { id: postId, lang: currentAdminLang },
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            logger.error(`Error fetching blog post details for ID ${postId} (GraphQL):`, err);
        }
    });

    const [updateBlogPost, { loading: mutationLoading }] = useMutation(ADMIN_UPDATE_BLOG_POST_MUTATION, {
        refetchQueries: [
            { query: ADMIN_GET_BLOG_POST_BY_ID_QUERY, variables: { id: postId, lang: currentAdminLang } },
            { query: ADMIN_GET_ALL_BLOG_POSTS_QUERY, variables: { limit: DEFAULT_PAGE_LIMIT, offset: 0, filter: {}, lang: currentAdminLang } }
        ],
        onError: (error) => {
            logger.error("Error in updateBlogPostMutation (GraphQL):", error);
            const messages = error.graphQLErrors?.map(e => e.message).join("\n") || error.message || "Cập nhật bài viết thất bại.";
            setSubmitError(messages);
        },
        onCompleted: (data) => {
            const updatedTitle = (currentAdminLang === 'en' && data.adminUpdateBlogPost.title_en)
                                     ? data.adminUpdateBlogPost.title_en
                                     : data.adminUpdateBlogPost.title_vi;
            logger.info('Blog post updated successfully via GraphQL:', data);
            navigate('/blog/posts', { state: { successMessage: `Bài viết "${updatedTitle}" đã được cập nhật thành công!` } });
        }
    });

    const handleFormSubmit = async (preparedDataFromForm) => {
        setSubmitError(null);
        logger.info("BlogPostEditPage: Calling updateBlogPost mutation with input:", preparedDataFromForm);
        try {
            // BlogPostForm đã chuẩn bị input đúng cấu trúc, bao gồm cả ID nếu cần
            await updateBlogPost({ variables: { id: postId, input: preparedDataFromForm } });
        } catch (gqlError) {
            if (!submitError && gqlError) {
                logger.error("Error caught in BlogPostEditPage handleSubmit:", gqlError);
                const messages = gqlError.graphQLErrors?.map(e => e.message).join("\n") || gqlError.message || "Đã xảy ra lỗi không mong muốn.";
                setSubmitError(messages);
            }
        }
    };

    if (queryLoading) return <LoadingSpinner message="Đang tải chi tiết bài viết..." />;
    
    if (queryError) {
        return (
            <Container fluid className="p-md-4 p-3">
                 <Breadcrumb className="mb-3">
                    <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="/blog/posts">Blog</Breadcrumb.Item>
                    <Breadcrumb.Item active>Lỗi</Breadcrumb.Item>
                </Breadcrumb>
                <AlertMessage variant="danger" className="mb-3">
                    Lỗi tải bài viết: {queryError.message}
                    <Button variant="outline-primary" size="sm" className="ms-2" onClick={() => refetchPostDetails()}>Thử lại</Button>
                </AlertMessage>
            </Container>
        );
    }

    const initialPostData = postQueryResult?.adminGetBlogPostById;

    if (!initialPostData && !queryLoading) {
        return (
            <Container fluid className="p-md-4 p-3">
                <Breadcrumb className="mb-3">
                    <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="/blog/posts">Blog</Breadcrumb.Item>
                    <Breadcrumb.Item active>Không tìm thấy</Breadcrumb.Item>
                </Breadcrumb>
                <AlertMessage variant="warning">Không tìm thấy bài viết với ID: {postId}.</AlertMessage>
                <Link to="/blog/posts" className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-arrow-left me-1"></i> Quay lại Danh sách Bài viết
                </Link>
            </Container>
        );
    }
    
    const displayPostTitle = (currentAdminLang === 'en' && initialPostData?.title_en) 
                                ? initialPostData.title_en 
                                : initialPostData?.title_vi;

    return (
        <Container fluid className="p-md-4 p-3">
            <Breadcrumb className="mb-3">
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="/blog/posts">Blog</Breadcrumb.Item>
                <Breadcrumb.Item active>Chỉnh sửa Bài viết</Breadcrumb.Item>
            </Breadcrumb>

            <Row className="align-items-center mb-3">
                <Col>
                    <h1 className="h3 mb-0 text-dark-blue">Chỉnh sửa Bài viết: <span className="text-primary">{displayPostTitle || `ID: ${postId}`}</span></h1>
                </Col>
                <Col xs="auto">
                    <Link to="/blog/posts">
                        <Button variant="outline-secondary" size="sm">
                            <i className="bi bi-arrow-left me-1"></i> Quay lại Danh sách
                        </Button>
                    </Link>
                </Col>
            </Row>

            {submitError && (
                 <AlertMessage variant="danger" className="mb-3" onClose={() => setSubmitError(null)} dismissible>
                    {submitError.split("\n").map((line, idx) => (<span key={idx}>{line}<br/></span>))}
                </AlertMessage>
            )}

            {/* <Card className="shadow-sm border-light">
                <Card.Body className="p-lg-4 p-3"> */}
                    {initialPostData && (
                        <BlogPostForm
                            initialData={initialPostData}
                            onSubmit={handleFormSubmit}
                            loading={mutationLoading}
                            isEditMode={true}
                            onCancel={() => navigate(`/blog/posts/edit/${postId}`)}
                        />
                    )}
                {/* </Card.Body>
            </Card> */}
        </Container>
    );
}

export default BlogPostEditPage;
