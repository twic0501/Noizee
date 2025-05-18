// admin-frontend/src/components/blog/BlogTagForm.jsx
    import React, { useState, useEffect } from 'react';
    import { Form, Button, Card, FloatingLabel, Tabs, Tab, Spinner } from 'react-bootstrap';
    import { useNavigate } from 'react-router-dom';
    import AlertMessage from '../common/AlertMessage';
    import { ADMIN_LANGUAGE_KEY } from '../../utils/constants';
    import logger from '../../utils/logger'; // Added logger

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

    function BlogTagForm({ initialData, onSubmit, loading, error, isEditMode = false, onCancel }) {
        const navigate = useNavigate();
        const [activeLangTab, setActiveLangTab] = useState(localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi');
        
        const [formData, setFormData] = useState({
            name_vi: '',
            name_en: '',
            slug: '',
        });
        const [formError, setFormError] = useState('');

        useEffect(() => {
            if (isEditMode && initialData) {
                setFormData({
                    name_vi: initialData.name_vi || '',
                    name_en: initialData.name_en || '',
                    slug: initialData.slug || '',
                });
            } else if (!isEditMode) {
                setFormData({ name_vi: '', name_en: '', slug: '' });
            }
        }, [isEditMode, initialData]);

        const handleNameChange = (e, lang) => {
            const { name, value } = e.target;
            setFormData(prev => {
                const newState = { ...prev, [name]: value };
                if (lang === 'vi' && (!isEditMode || !formData.slug || formData.slug === generateSlug(prev.name_vi))) {
                    newState.slug = generateSlug(value);
                }
                return newState;
            });
            setFormError('');
        };

        const handleSlugChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: generateSlug(value) })); 
            setFormError('');
        };
        
        // This handleChange is for fields other than name_vi/name_en if any, to avoid auto-slug generation
        // const handleChange = (e) => { 
        //     const { name, value } = e.target;
        //     setFormData(prev => ({ ...prev, [name]: value }));
        //     setFormError('');
        // }

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!formData.name_vi.trim()) {
                setFormError('Tên thẻ (Tiếng Việt) là bắt buộc.');
                setActiveLangTab('vi');
                return;
            }
            let finalSlug = formData.slug.trim();
            if (!finalSlug && formData.name_vi.trim()) {
                finalSlug = generateSlug(formData.name_vi.trim());
            }
            if (!finalSlug) {
                 setFormError('Slug là bắt buộc và không thể tự tạo từ tên đã nhập.');
                 return;
            }
            
            const dataToSubmit = {...formData, slug: finalSlug };
            logger.info("BlogTagForm submitting data:", dataToSubmit); // Log data before submit
            onSubmit(dataToSubmit);
        };

        return (
            // This is the correct structure based on your "gốc" file.
            // The errors in your screenshot (lines 153-156) do not correspond to this file's length or structure.
            // Please ensure the file you are editing locally matches this structure,
            // or the error might be in a different file or due to other syntax issues in your local version.
            <Card className="shadow-sm">
                <Card.Header as="h5">{isEditMode ? 'Chỉnh sửa Thẻ Blog' : 'Tạo Thẻ Blog mới'}</Card.Header>
                <Card.Body>
                    {formError && <AlertMessage variant="danger" onClose={() => setFormError('')} dismissible>{formError}</AlertMessage>}
                    {error && <AlertMessage variant="danger">Lỗi từ server: {error.message}</AlertMessage>}

                    <Form onSubmit={handleSubmit}>
                        <Tabs activeKey={activeLangTab} onSelect={(k) => setActiveLangTab(k)} id="blogtag-language-tabs" className="mb-3 nav-pills-sm">
                            <Tab eventKey="vi" title="Tiếng Việt (VI)">
                                <Form.Group className="mb-3" controlId="tagNameVi">
                                    <FloatingLabel label={<>Tên Thẻ (VI) <span className="text-danger">*</span></>}>
                                        <Form.Control
                                            type="text"
                                            name="name_vi"
                                            value={formData.name_vi}
                                            onChange={(e) => handleNameChange(e, 'vi')}
                                            placeholder="Nhập tên thẻ bằng tiếng Việt"
                                            required
                                            disabled={loading}
                                        />
                                    </FloatingLabel>
                                </Form.Group>
                            </Tab>
                            <Tab eventKey="en" title="English (EN)">
                                <Form.Group className="mb-3" controlId="tagNameEn">
                                    <FloatingLabel label="Tag Name (EN)">
                                        <Form.Control
                                            type="text"
                                            name="name_en"
                                            value={formData.name_en}
                                            onChange={(e) => handleNameChange(e, 'en')}
                                            placeholder="Enter tag name in English"
                                            disabled={loading}
                                        />
                                    </FloatingLabel>
                                </Form.Group>
                            </Tab>
                        </Tabs>

                        <Form.Group className="mb-3" controlId="tagSlug">
                            <FloatingLabel label={<>Slug <span className="text-danger">*</span></>}>
                                <Form.Control
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleSlugChange}
                                    placeholder="ví-dụ: ten-the-blog"
                                    required
                                    disabled={loading}
                                />
                            </FloatingLabel>
                            <Form.Text muted>
                                Slug là phiên bản thân thiện với URL của tên (thường là chữ thường và chứa dấu gạch ngang).
                            </Form.Text>
                        </Form.Group>

                        <div className="mt-3 d-flex justify-content-end">
                            <Button variant="outline-secondary" type="button" onClick={onCancel || (() => navigate('/blog/tags'))} className="me-2" disabled={loading}>
                                Hủy
                            </Button>
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />}
                                {isEditMode ? 'Lưu thay đổi' : 'Tạo Thẻ'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        );
    }

    export default BlogTagForm;