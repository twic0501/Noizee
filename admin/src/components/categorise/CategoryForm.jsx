// admin-frontend/src/components/categories/CategoryForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, FloatingLabel, Tabs, Tab,Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import { ADMIN_LANGUAGE_KEY } from '../../utils/constants';

function CategoryForm({ initialData, onSubmit, loading, error, isEditMode = false, onCancel }) {
    const navigate = useNavigate();
    const [activeLangTab, setActiveLangTab] = useState(localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi');
    
    const [formData, setFormData] = useState({
        category_name_vi: '',
        category_name_en: '',
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                category_name_vi: initialData.category_name_vi || '',
                category_name_en: initialData.category_name_en || '',
            });
        } else if (!isEditMode) {
            setFormData({ category_name_vi: '', category_name_en: '' });
        }
    }, [isEditMode, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormError(''); // Clear error on change
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.category_name_vi.trim()) {
            setFormError('Tên danh mục (Tiếng Việt) là bắt buộc.');
            setActiveLangTab('vi'); // Chuyển sang tab tiếng Việt nếu có lỗi
            return;
        }
        // Các validation khác có thể thêm ở đây
        onSubmit(formData);
    };

    return (
        <Card className="shadow-sm">
            <Card.Header as="h5">{isEditMode ? 'Chỉnh sửa Danh mục' : 'Tạo Danh mục mới'}</Card.Header>
            <Card.Body>
                {formError && <AlertMessage variant="danger" onClose={() => setFormError('')} dismissible>{formError}</AlertMessage>}
                {error && <AlertMessage variant="danger">Lỗi từ server: {error.message}</AlertMessage>}

                <Form onSubmit={handleSubmit}>
                    <Tabs activeKey={activeLangTab} onSelect={(k) => setActiveLangTab(k)} id="category-language-tabs" className="mb-3">
                        <Tab eventKey="vi" title="Tiếng Việt (VI)">
                            <Form.Group className="mb-3" controlId="categoryNameVi">
                                <FloatingLabel label={<>Tên Danh mục (VI) <span className="text-danger">*</span></>}>
                                    <Form.Control
                                        type="text"
                                        name="category_name_vi"
                                        value={formData.category_name_vi}
                                        onChange={handleChange}
                                        placeholder="Nhập tên danh mục bằng tiếng Việt"
                                        required
                                        disabled={loading}
                                    />
                                </FloatingLabel>
                            </Form.Group>
                        </Tab>
                        <Tab eventKey="en" title="English (EN)">
                            <Form.Group className="mb-3" controlId="categoryNameEn">
                                <FloatingLabel label="Category Name (EN)">
                                    <Form.Control
                                        type="text"
                                        name="category_name_en"
                                        value={formData.category_name_en}
                                        onChange={handleChange}
                                        placeholder="Enter category name in English"
                                        disabled={loading}
                                    />
                                </FloatingLabel>
                            </Form.Group>
                        </Tab>
                    </Tabs>

                    <div className="mt-3 d-flex justify-content-end">
                        <Button variant="outline-secondary" type="button" onClick={onCancel || (() => navigate('/categories'))} className="me-2" disabled={loading}>
                            Hủy
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />}
                            {isEditMode ? 'Lưu thay đổi' : 'Tạo Danh mục'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default CategoryForm;