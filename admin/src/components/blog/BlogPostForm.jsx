// admin-frontend/src/components/blog/BlogPostForm.jsx
    import React, { useState, useEffect, useCallback } from 'react';
    import { Form, Button, Row, Col, Card, FloatingLabel, Tabs, Tab, Spinner, Image, InputGroup } from 'react-bootstrap'; // Added Card
    import { useNavigate } from 'react-router-dom';
    import { useQuery } from '@apollo/client';
    import Select from 'react-select'; 

    import AlertMessage from '../common/AlertMessage';
    // import LoadingSpinner from '../common/LoadingSpinner'; // Not used directly, Card has its own loading
    import { ADMIN_LANGUAGE_KEY, ADMIN_TOKEN_KEY, PLACEHOLDER_IMAGE_PATH } from '../../utils/constants';
    import { ADMIN_GET_ALL_BLOG_TAGS_QUERY } from '../../api/queries/blogTagQueries'; 
    import { getFullImageUrl } from '../../utils/formatters';
    import logger from '../../utils/logger';

    const BLOG_IMAGE_UPLOAD_ENDPOINT = `${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000'}/api/uploads/blog-images`; 

    const generateSlug = (text) => {
      if (!text) return '';
      return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '').replace(/-+$/, '');
    };

    const initialFormData = {
        title_vi: '', title_en: '',
        excerpt_vi: '', excerpt_en: '',
        content_html_vi: '', content_html_en: '',
        meta_title_vi: '', meta_title_en: '',
        meta_description_vi: '', meta_description_en: '',
        slug: '',
        featured_image_url: '',
        status: 'draft', 
        visibility: 'public',
        allow_comments: true,
        template_key: '',
        tag_ids: [], 
    };

    function BlogPostForm({ initialData, onSubmit, loading: formLoading, error: formErrorProp, isEditMode = false, onCancel }) {
        const navigate = useNavigate();
        const [activeLangTab, setActiveLangTab] = useState(localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi');
        
        const [formData, setFormData] = useState(initialFormData);
        const [formError, setFormError] = useState('');
        const [imagePreview, setImagePreview] = useState(null);
        const [isUploadingImage, setIsUploadingImage] = useState(false);

        const { data: tagsData, loading: tagsLoading, error: tagsError } = useQuery(ADMIN_GET_ALL_BLOG_TAGS_QUERY, {
            variables: { lang: activeLangTab } 
        });

        const availableTags = tagsData?.adminGetAllBlogTags?.map(tag => ({
            value: tag.tag_id,
            label: (activeLangTab === 'en' && tag.name_en) ? tag.name_en : tag.name_vi,
        })) || [];

        useEffect(() => {
            if (isEditMode && initialData) {
                setFormData({
                    title_vi: initialData.title_vi || '',
                    title_en: initialData.title_en || '',
                    excerpt_vi: initialData.excerpt_vi || '',
                    excerpt_en: initialData.excerpt_en || '',
                    content_html_vi: initialData.content_html_vi || '',
                    content_html_en: initialData.content_html_en || '',
                    meta_title_vi: initialData.meta_title_vi || '',
                    meta_title_en: initialData.meta_title_en || '',
                    meta_description_vi: initialData.meta_description_vi || '',
                    meta_description_en: initialData.meta_description_en || '',
                    slug: initialData.slug || '',
                    featured_image_url: initialData.featured_image_url || '',
                    status: initialData.status || 'draft',
                    visibility: initialData.visibility || 'public',
                    allow_comments: initialData.allow_comments !== undefined ? initialData.allow_comments : true,
                    template_key: initialData.template_key || '',
                    tag_ids: initialData.tags?.map(tag => tag.tag_id) || [], // Ensure tag_ids are populated
                });
                if (initialData.featured_image_url) {
                    setImagePreview(getFullImageUrl(initialData.featured_image_url));
                } else {
                    setImagePreview(null);
                }
            } else if (!isEditMode) {
                setFormData(initialFormData);
                setImagePreview(null);
            }
        }, [isEditMode, initialData]);

        useEffect(() => {
            if (formErrorProp) setFormError(formErrorProp.message || 'Lỗi không xác định.');
        }, [formErrorProp]);

        const handleInputChange = (e) => {
            const { name, value, type, checked } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
            setFormError('');
        };

        const handleTitleChange = (e, lang) => {
            const { name, value } = e.target;
            setFormData(prev => {
                const newState = { ...prev, [name]: value };
                if (lang === 'vi' && (!isEditMode || !formData.slug || formData.slug === generateSlug(prev.title_vi))) {
                    newState.slug = generateSlug(value);
                }
                return newState;
            });
            setFormError('');
        };
        
        const handleSlugChange = (e) => {
            setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
             setFormError('');
        };

        const handleTagChange = (selectedOptions) => {
            setFormData(prev => ({
                ...prev,
                tag_ids: selectedOptions ? selectedOptions.map(option => option.value) : [],
            }));
        };

        const handleImageUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            setIsUploadingImage(true);
            setFormError('');
            const uploadFormData = new FormData();
            uploadFormData.append('blogImage', file);

            try {
                const token = localStorage.getItem(ADMIN_TOKEN_KEY);
                const response = await fetch(BLOG_IMAGE_UPLOAD_ENDPOINT, {
                    method: 'POST',
                    body: uploadFormData,
                    headers: { ...(token && { 'Authorization': `Bearer ${token}` }) }
                });
                const result = await response.json();
                if (!response.ok || !result.success || !result.imageUrl) {
                    throw new Error(result.message || 'Upload ảnh thất bại.');
                }
                setFormData(prev => ({ ...prev, featured_image_url: result.imageUrl }));
                setImagePreview(getFullImageUrl(result.imageUrl));
            } catch (err) {
                logger.error('Blog image upload error:', err);
                setFormError(`Lỗi tải ảnh: ${err.message}`);
                setImagePreview(formData.featured_image_url ? getFullImageUrl(formData.featured_image_url) : null);
            } finally {
                setIsUploadingImage(false);
            }
        };

        const validateForm = () => {
            if (!formData.title_vi.trim()) {
                setActiveLangTab('vi');
                return "Tiêu đề (Tiếng Việt) là bắt buộc.";
            }
            if (!formData.content_html_vi.trim()) {
                setActiveLangTab('vi');
                return "Nội dung (Tiếng Việt) là bắt buộc.";
            }
            if (!formData.slug.trim()) {
                const autoSlug = generateSlug(formData.title_vi);
                if(!autoSlug) return "Slug là bắt buộc và không thể tự tạo từ tiêu đề.";
            }
            return null;
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            const validationError = validateForm();
            if (validationError) {
                setFormError(validationError);
                return;
            }
            setFormError('');

            const dataToSubmit = { ...formData };
            if (!dataToSubmit.slug.trim() && dataToSubmit.title_vi.trim()) {
                dataToSubmit.slug = generateSlug(dataToSubmit.title_vi);
            }
            dataToSubmit.tag_ids = dataToSubmit.tag_ids.map(id => String(id));

            onSubmit(dataToSubmit);
        };
        
        const selectedTagOptions = availableTags.filter(option => formData.tag_ids.includes(option.value));

        return (
            <Card className="shadow-sm">
                <Card.Header as="h5">{isEditMode ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết mới'}</Card.Header>
                <Card.Body>
                    {formError && <AlertMessage variant="danger" onClose={() => setFormError('')} dismissible>{formError}</AlertMessage>}
                    {formErrorProp && <AlertMessage variant="danger">Lỗi từ server: {formErrorProp.message}</AlertMessage>} {/* Changed error to formErrorProp */}
                    {tagsError && <AlertMessage variant="warning">Không thể tải danh sách thẻ: {tagsError.message}</AlertMessage>}

                    <Form onSubmit={handleSubmit}>
                        <Tabs activeKey={activeLangTab} onSelect={(k) => setActiveLangTab(k)} id="blogpost-language-tabs" className="mb-3 nav-pills-sm">
                            <Tab eventKey="vi" title="Nội dung (VI)">
                                <Form.Group className="mb-3" controlId="blogPostTitleVi">
                                    <FloatingLabel label={<>Tiêu đề (VI) <span className="text-danger">*</span></>}>
                                        <Form.Control type="text" name="title_vi" value={formData.title_vi} onChange={(e) => handleTitleChange(e, 'vi')} required disabled={formLoading} />
                                    </FloatingLabel>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="blogPostExcerptVi">
                                    <FloatingLabel label="Tóm tắt (VI)">
                                        <Form.Control as="textarea" rows={3} name="excerpt_vi" value={formData.excerpt_vi} onChange={handleInputChange} disabled={formLoading} style={{ minHeight: '100px' }} />
                                    </FloatingLabel>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="blogPostContentVi">
                                    <Form.Label>Nội dung (VI) <span className="text-danger">*</span></Form.Label>
                                    <Form.Control as="textarea" rows={10} name="content_html_vi" value={formData.content_html_vi} onChange={handleInputChange} required disabled={formLoading} placeholder="Nhập nội dung bài viết bằng Tiếng Việt..." style={{ minHeight: '250px' }} />
                                    <Form.Text muted>Bạn có thể sử dụng HTML. Cân nhắc tích hợp Rich Text Editor.</Form.Text>
                                </Form.Group>
                            </Tab>
                            <Tab eventKey="en" title="Content (EN)">
                                <Form.Group className="mb-3" controlId="blogPostTitleEn">
                                    <FloatingLabel label="Title (EN)">
                                        <Form.Control type="text" name="title_en" value={formData.title_en} onChange={(e) => handleTitleChange(e, 'en')} disabled={formLoading} />
                                    </FloatingLabel>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="blogPostExcerptEn">
                                    <FloatingLabel label="Excerpt (EN)">
                                        <Form.Control as="textarea" rows={3} name="excerpt_en" value={formData.excerpt_en} onChange={handleInputChange} disabled={formLoading} style={{ minHeight: '100px' }} />
                                    </FloatingLabel>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="blogPostContentEn">
                                    <Form.Label>Content (EN)</Form.Label>
                                    <Form.Control as="textarea" rows={10} name="content_html_en" value={formData.content_html_en} onChange={handleInputChange} disabled={formLoading} placeholder="Enter post content in English..." style={{ minHeight: '250px' }} />
                                </Form.Group>
                            </Tab>
                            <Tab eventKey="seo" title="SEO">
                                 <Form.Group className="mb-3" controlId="blogPostMetaTitleVi">
                                    <FloatingLabel label="Meta Title (VI)">
                                        <Form.Control type="text" name="meta_title_vi" value={formData.meta_title_vi} onChange={handleInputChange} disabled={formLoading} />
                                    </FloatingLabel>
                                </Form.Group>
                                 <Form.Group className="mb-3" controlId="blogPostMetaDescriptionVi">
                                    <FloatingLabel label="Meta Description (VI)">
                                        <Form.Control as="textarea" rows={2} name="meta_description_vi" value={formData.meta_description_vi} onChange={handleInputChange} disabled={formLoading} />
                                    </FloatingLabel>
                                </Form.Group>
                                 <hr/>
                                 <Form.Group className="mb-3" controlId="blogPostMetaTitleEn">
                                    <FloatingLabel label="Meta Title (EN)">
                                        <Form.Control type="text" name="meta_title_en" value={formData.meta_title_en} onChange={handleInputChange} disabled={formLoading} />
                                    </FloatingLabel>
                                </Form.Group>
                                 <Form.Group className="mb-3" controlId="blogPostMetaDescriptionEn">
                                    <FloatingLabel label="Meta Description (EN)">
                                        <Form.Control as="textarea" rows={2} name="meta_description_en" value={formData.meta_description_en} onChange={handleInputChange} disabled={formLoading} />
                                    </FloatingLabel>
                                </Form.Group>
                            </Tab>
                        </Tabs>

                        <Row>
                            <Col md={8}>
                                <Card className="mb-3">
                                    <Card.Header>Thuộc tính bài viết</Card.Header>
                                    <Card.Body>
                                        <Form.Group className="mb-3" controlId="blogPostSlug">
                                            <FloatingLabel label={<>Slug <span className="text-danger">*</span></>}>
                                                <Form.Control type="text" name="slug" value={formData.slug} onChange={handleSlugChange} required disabled={formLoading} />
                                            </FloatingLabel>
                                            <Form.Text muted>Slug sẽ tự động tạo từ tiêu đề tiếng Việt nếu bỏ trống.</Form.Text>
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="blogPostTemplateKey">
                                            <FloatingLabel label="Template Key (Tùy chọn)">
                                                <Form.Control type="text" name="template_key" value={formData.template_key} onChange={handleInputChange} disabled={formLoading} placeholder="Ví dụ: video_post_layout" />
                                            </FloatingLabel>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="mb-3">
                                    <Card.Header>Ảnh đại diện</Card.Header>
                                    <Card.Body>
                                        {imagePreview && <Image src={imagePreview} alt="Ảnh đại diện xem trước" fluid rounded className="mb-2" style={{maxHeight: '200px', objectFit: 'cover'}}/>}
                                        {!imagePreview && <Image src={PLACEHOLDER_IMAGE_PATH} alt="Placeholder" fluid rounded className="mb-2" />}
                                        
                                        <Form.Group controlId="featuredImageUpload">
                                            <Form.Control 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleImageUpload} 
                                                disabled={formLoading || isUploadingImage}
                                                size="sm"
                                            />
                                            {isUploadingImage && <Spinner animation="border" size="sm" className="ms-2 mt-1" />}
                                        </Form.Group>
                                         <Form.Group className="mt-2" controlId="featuredImageUrlManual">
                                            <FloatingLabel label="Hoặc nhập URL ảnh">
                                                <Form.Control 
                                                    type="text" 
                                                    name="featured_image_url" 
                                                    value={formData.featured_image_url} 
                                                    onChange={handleInputChange} 
                                                    disabled={formLoading || isUploadingImage}
                                                    placeholder="[https://example.com/image.jpg](https://example.com/image.jpg)"
                                                />
                                            </FloatingLabel>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>

                                <Card className="mb-3">
                                    <Card.Header>Xuất bản</Card.Header>
                                    <Card.Body>
                                        <Form.Group className="mb-3" controlId="blogPostStatus">
                                            <FloatingLabel label="Trạng thái">
                                                <Form.Select name="status" value={formData.status} onChange={handleInputChange} disabled={formLoading}>
                                                    <option value="draft">Bản nháp</option>
                                                    <option value="published">Đã xuất bản</option>
                                                    <option value="archived">Đã lưu trữ</option>
                                                </Form.Select>
                                            </FloatingLabel>
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="blogPostVisibility">
                                            <FloatingLabel label="Hiển thị">
                                                <Form.Select name="visibility" value={formData.visibility} onChange={handleInputChange} disabled={formLoading}>
                                                    <option value="public">Công khai</option>
                                                    <option value="private">Riêng tư</option>
                                                </Form.Select>
                                            </FloatingLabel>
                                        </Form.Group>
                                        <Form.Check
                                            type="switch"
                                            id="allowCommentsSwitch"
                                            label="Cho phép bình luận"
                                            name="allow_comments"
                                            checked={formData.allow_comments}
                                            onChange={handleInputChange}
                                            disabled={formLoading}
                                        />
                                    </Card.Body>
                                </Card>

                                <Card className="mb-3">
                                    <Card.Header>Thẻ (Tags)</Card.Header>
                                    <Card.Body>
                                        <Form.Group controlId="blogPostTags">
                                            <Select
                                                isMulti
                                                name="tag_ids"
                                                options={availableTags}
                                                className="basic-multi-select"
                                                classNamePrefix="select"
                                                isLoading={tagsLoading}
                                                placeholder="Chọn thẻ..."
                                                value={selectedTagOptions}
                                                onChange={handleTagChange}
                                                isDisabled={formLoading || tagsLoading}
                                            />
                                            {tagsError && <Form.Text className="text-danger">Không thể tải thẻ.</Form.Text>}
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <div className="mt-4 d-flex justify-content-end border-top pt-3">
                            <Button variant="outline-secondary" type="button" onClick={onCancel || (() => navigate('/blog/posts'))} className="me-2" disabled={formLoading}>
                                Hủy
                            </Button>
                            <Button variant="primary" type="submit" disabled={formLoading || isUploadingImage}>
                                {(formLoading || isUploadingImage) && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />}
                                {isEditMode ? 'Lưu Bài viết' : 'Tạo Bài viết'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        );
    }

    export default BlogPostForm;