// admin-frontend/src/components/collections/CollectionForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, FloatingLabel, Tabs, Tab ,Spinner} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import { ADMIN_LANGUAGE_KEY } from '../../utils/constants';

// Hàm helper tạo slug (có thể đặt trong utils)
const generateSlug = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
    .replace(/đ/g, 'd').replace(/Đ/g, 'D') // Xử lý chữ Đ
    .replace(/\s+/g, '-') // Thay khoảng trắng bằng -
    .replace(/[^\w-]+/g, '') // Bỏ ký tự đặc biệt
    .replace(/--+/g, '-') // Thay nhiều -- bằng một -
    .replace(/^-+/, '').replace(/-+$/, ''); // Bỏ - ở đầu/cuối
};


function CollectionForm({ initialData, onSubmit, loading, error, isEditMode = false, onCancel }) {
    const navigate = useNavigate();
    const [activeLangTab, setActiveLangTab] = useState(localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi');

    const [formData, setFormData] = useState({
        collection_name_vi: '',
        collection_name_en: '',
        collection_description_vi: '',
        collection_description_en: '',
        slug: '',
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                collection_name_vi: initialData.collection_name_vi || '',
                collection_name_en: initialData.collection_name_en || '',
                collection_description_vi: initialData.collection_description_vi || '',
                collection_description_en: initialData.collection_description_en || '',
                slug: initialData.slug || '',
            });
        } else if (!isEditMode) {
            setFormData({ collection_name_vi: '', collection_name_en: '', collection_description_vi: '', collection_description_en: '', slug: '' });
        }
    }, [isEditMode, initialData]);

    const handleNameChange = (e, lang) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            // Tự động tạo slug từ tên tiếng Việt nếu slug đang rỗng hoặc đang tạo mới
            if (lang === 'vi' && (!isEditMode || !formData.slug || formData.slug === generateSlug(prev.collection_name_vi))) {
                newState.slug = generateSlug(value);
            }
            return newState;
        });
        setFormError('');
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.collection_name_vi.trim()) {
            setFormError('Tên bộ sưu tập (Tiếng Việt) là bắt buộc.');
            setActiveLangTab('vi');
            return;
        }
        if (!formData.slug.trim()) {
            setFormError('Slug là bắt buộc.');
            return;
        }
        onSubmit(formData);
    };

    return (
        <Card className="shadow-sm">
            <Card.Header as="h5">{isEditMode ? 'Chỉnh sửa Bộ sưu tập' : 'Tạo Bộ sưu tập mới'}</Card.Header>
            <Card.Body>
                {formError && <AlertMessage variant="danger" onClose={() => setFormError('')} dismissible>{formError}</AlertMessage>}
                {error && <AlertMessage variant="danger">Lỗi từ server: {error.message}</AlertMessage>}

                <Form onSubmit={handleSubmit}>
                    <Tabs activeKey={activeLangTab} onSelect={(k) => setActiveLangTab(k)} id="collection-language-tabs" className="mb-3">
                        <Tab eventKey="vi" title="Tiếng Việt (VI)">
                            <Form.Group className="mb-3" controlId="collectionNameVi">
                                <FloatingLabel label={<>Tên Bộ sưu tập (VI) <span className="text-danger">*</span></>}>
                                    <Form.Control
                                        type="text"
                                        name="collection_name_vi"
                                        value={formData.collection_name_vi}
                                        onChange={(e) => handleNameChange(e, 'vi')}
                                        placeholder="Nhập tên bộ sưu tập (Tiếng Việt)"
                                        required
                                        disabled={loading}
                                    />
                                </FloatingLabel>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="collectionDescriptionVi">
                                <FloatingLabel label="Mô tả (VI)">
                                    <Form.Control
                                        as="textarea" rows={3}
                                        name="collection_description_vi"
                                        value={formData.collection_description_vi}
                                        onChange={handleChange}
                                        placeholder="Nhập mô tả (Tiếng Việt)"
                                        disabled={loading}
                                    />
                                </FloatingLabel>
                            </Form.Group>
                        </Tab>
                        <Tab eventKey="en" title="English (EN)">
                            <Form.Group className="mb-3" controlId="collectionNameEn">
                                <FloatingLabel label="Collection Name (EN)">
                                    <Form.Control
                                        type="text"
                                        name="collection_name_en"
                                        value={formData.collection_name_en}
                                        onChange={(e) => handleNameChange(e, 'en')}
                                        placeholder="Enter collection name in English"
                                        disabled={loading}
                                    />
                                </FloatingLabel>
                            </Form.Group>
                             <Form.Group className="mb-3" controlId="collectionDescriptionEn">
                                <FloatingLabel label="Description (EN)">
                                    <Form.Control
                                        as="textarea" rows={3}
                                        name="collection_description_en"
                                        value={formData.collection_description_en}
                                        onChange={handleChange}
                                        placeholder="Enter description in English"
                                        disabled={loading}
                                    />
                                </FloatingLabel>
                            </Form.Group>
                        </Tab>
                    </Tabs>

                    <Form.Group className="mb-3" controlId="collectionSlug">
                        <FloatingLabel label={<>Slug <span className="text-danger">*</span></>}>
                            <Form.Control
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange} // Cho phép sửa slug thủ công
                                placeholder="ví-dụ: bo-suu-tap-mua-he"
                                required
                                disabled={loading}
                            />
                        </FloatingLabel>
                        <Form.Text muted>
                            Slug là phiên bản thân thiện với URL của tên (thường là chữ thường và chứa dấu gạch ngang).
                        </Form.Text>
                    </Form.Group>

                    <div className="mt-3 d-flex justify-content-end">
                        <Button variant="outline-secondary" type="button" onClick={onCancel || (() => navigate('/collections'))} className="me-2" disabled={loading}>
                            Hủy
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />}
                            {isEditMode ? 'Lưu thay đổi' : 'Tạo Bộ sưu tập'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default CollectionForm;
