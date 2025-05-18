// admin-frontend/src/pages/Blog/BlogPostCreatePage.jsx
import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Row, Col, Breadcrumb } from 'react-bootstrap';
import BlogPostForm from '../../components/blog/BlogPostForm'; // Component form đã tạo
import { ADMIN_CREATE_BLOG_POST_MUTATION } from '../../api/mutations/blogPostMutations';
import { ADMIN_GET_ALL_BLOG_POSTS_QUERY } from '../../api/queries/blogPostQueries'; // Để refetch
import AlertMessage from '../../components/common/AlertMessage';
import logger from '../../utils/logger';
import { DEFAULT_PAGE_LIMIT, ADMIN_LANGUAGE_KEY } from '../../utils/constants';

function BlogPostCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [submitError, setSubmitError] = useState(null);
    const [successFlashMessage, setSuccessFlashMessage] = useState(location.state?.successMessage || null);
    const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

    useEffect(() => {
        if (successFlashMessage) {
            const timer = setTimeout(() => {
                setSuccessFlashMessage(null);
                navigate(location.pathname, { replace: true, state: {} });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successFlashMessage, location.pathname, navigate]);

    const [createBlogPost, { loading: mutationLoading }] = useMutation(ADMIN_CREATE_BLOG_POST_MUTATION, {
        refetchQueries: [
            {
                query: ADMIN_GET_ALL_BLOG_POSTS_QUERY,
                variables: { limit: DEFAULT_PAGE_LIMIT, offset: 0, filter: {}, lang: currentAdminLang },
            },
        ],
        onError: (error) => {
            logger.error("Error in createBlogPostMutation (GraphQL):", error);
            const messages = error.graphQLErrors?.map(e => e.message).join("\n") || error.message || "Tạo bài viết thất bại.";
            setSubmitError(messages);
        },
        onCompleted: (data) => {
            const newTitle = (currentAdminLang === 'en' && data.adminCreateBlogPost.title_en)
                                 ? data.adminCreateBlogPost.title_en
                                 : data.adminCreateBlogPost.title_vi;
            logger.info('Blog post created successfully via GraphQL:', data);
            navigate('/blog/posts', { state: { successMessage: `Bài viết "${newTitle}" đã được tạo thành công!` } });
        }
    });

    const handleFormSubmit = async (preparedDataFromForm) => {
        setSubmitError(null);
        logger.info("BlogPostCreatePage: Calling createBlogPost mutation with input:", preparedDataFromForm);

        try {
            // preparedDataFromForm đã có cấu trúc đúng với CreateBlogPostAdminInput! từ BlogPostForm
            await createBlogPost({ variables: { input: preparedDataFromForm } });
        } catch (gqlError) {
            if (!submitError && gqlError) {
                logger.error("Error caught directly in BlogPostCreatePage handleSubmit:", gqlError);
                 const messages = gqlError.graphQLErrors?.map(e => e.message).join("\n") || gqlError.message || "Đã xảy ra lỗi không mong muốn.";
                setSubmitError(messages);
            }
        }
    };

    return (
        <Container fluid className="p-md-4 p-3">
            <Breadcrumb className="mb-3">
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="/blog/posts">Blog</Breadcrumb.Item>
                <Breadcrumb.Item active>Tạo Bài viết mới</Breadcrumb.Item>
            </Breadcrumb>

            <Row className="align-items-center mb-3">
                <Col>
                    <h1 className="h3 mb-0 text-dark-blue">Tạo Bài viết Blog mới</h1>
                </Col>
            </Row>

            {successFlashMessage && <AlertMessage variant="success" dismissible onClose={() => setSuccessFlashMessage(null)}>{successFlashMessage}</AlertMessage>}
            {submitError && (
                <AlertMessage variant="danger" className="mb-3" onClose={() => setSubmitError(null)} dismissible>
                    {submitError.split("\n").map((line, idx) => (<span key={idx}>{line}<br/></span>))}
                </AlertMessage>
            )}

            {/* Card chứa form */}
            {/* <Card className="shadow-sm border-light">
                <Card.Body className="p-lg-4 p-3"> */}
                    <BlogPostForm
                        onSubmit={handleFormSubmit}
                        loading={mutationLoading}
                        isEditMode={false}
                        onCancel={() => navigate('/blog/posts')}
                        // error prop có thể dùng nếu BlogPostForm cần hiển thị lỗi từ trang cha
                        // error={submitError ? { message: submitError } : null} 
                    />
                {/* </Card.Body>
            </Card> */}
        </Container>
    );
}

export default BlogPostCreatePage;
