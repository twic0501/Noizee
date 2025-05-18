// admin-frontend/src/components/colors/ColorForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Row, Col, Card, FloatingLabel, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AlertMessage from '../common/AlertMessage';
import { HexColorPicker } from 'react-colorful';
// ADMIN_LANGUAGE_KEY không còn cần thiết nếu tên màu không đa ngôn ngữ

function ColorForm({ initialData, onSubmit, loading, error, isEditMode = false, onCancel }) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        color_name: '', // Chỉ một trường tên màu
        color_hex: '#ffffff',
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                color_name: initialData.color_name || '', // Sử dụng initialData.color_name
                color_hex: initialData.color_hex || '#ffffff',
            });
        } else if (!isEditMode) {
            setFormData({ color_name: '', color_hex: '#ffffff' });
        }
    }, [isEditMode, initialData]);

    const handleChange = (e) => { // Dùng cho color_name
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormError('');
    };

    const handleColorHexChange = useCallback((newColorHex) => {
        setFormData(prev => ({ ...prev, color_hex: newColorHex }));
        setFormError('');
    }, []);
    
    const handleHexInputChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, color_hex: value }));
         if (!/^#([0-9A-F]{3}){1,2}$/i.test(value) && value !== '') {
            setFormError('Mã HEX không hợp lệ. Phải bắt đầu bằng # và theo sau là 3 hoặc 6 ký tự hexa (0-9, A-F).');
        } else {
            setFormError('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.color_name.trim()) {
            setFormError('Tên màu là bắt buộc.');
            return;
        }
        if (!formData.color_hex || !/^#([0-9A-F]{3}){1,2}$/i.test(formData.color_hex)) {
            setFormError('Mã màu HEX không hợp lệ. Ví dụ: #FF0000 hoặc #F00.');
            return;
        }
        // formData bây giờ chỉ có color_name và color_hex
        onSubmit({ 
            color_name: formData.color_name,
            color_hex: formData.color_hex
        });
    };

    return (
        <Card className="shadow-sm">
            <Card.Header as="h5">{isEditMode ? 'Chỉnh sửa Màu sắc' : 'Tạo Màu sắc mới'}</Card.Header>
            <Card.Body>
                {formError && <AlertMessage variant="danger" onClose={() => setFormError('')} dismissible>{formError}</AlertMessage>}
                {error && <AlertMessage variant="danger" onClose={() => { /* Allow closing server error */ }}>Lỗi từ server: {error.message}</AlertMessage>}

                <Form onSubmit={handleSubmit}>
                    {/* Không cần Tabs nữa */}
                    <Form.Group className="mb-3" controlId="colorName">
                        <FloatingLabel label={<>Tên Màu <span className="text-danger">*</span></>}>
                            <Form.Control
                                type="text"
                                name="color_name" // name là "color_name"
                                value={formData.color_name}
                                onChange={handleChange}
                                placeholder="Nhập tên màu (ví dụ: Đỏ Tươi)"
                                required
                                disabled={loading}
                            />
                        </FloatingLabel>
                    </Form.Group>

                    <Row>
                        <Col md={6} className="mb-3 d-flex flex-column align-items-center">
                            <Form.Label htmlFor="colorHexPicker" className="mb-2">Chọn màu từ bảng:</Form.Label>
                            <HexColorPicker
                                id="colorHexPicker"
                                color={formData.color_hex || '#ffffff'}
                                onChange={handleColorHexChange}
                                style={{ width: '100%', maxWidth: '250px', height: '200px', margin: '0 auto' }}
                            />
                        </Col>
                        <Col md={6} className="mb-3">
                             <Form.Group controlId="colorHexDisplay">
                                <FloatingLabel label="Mã Màu HEX (ví dụ: #FF0000)">
                                    <Form.Control
                                        type="text"
                                        name="color_hex"
                                        value={formData.color_hex}
                                        onChange={handleHexInputChange}
                                        placeholder="#RRGGBB"
                                        disabled={loading}
                                        className="mb-2"
                                    />
                                </FloatingLabel>
                                <div className="d-flex align-items-center mt-2">
                                    <span className="me-2">Xem trước:</span>
                                    <div style={{
                                        width: '30px',
                                        height: '30px',
                                        backgroundColor: /^#([0-9A-F]{3}){1,2}$/i.test(formData.color_hex) ? formData.color_hex : 'transparent',
                                        border: '1px solid #ced4da',
                                        borderRadius: '0.25rem'
                                    }} title="Xem trước màu"></div>
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="mt-4 d-flex justify-content-end">
                        <Button variant="outline-secondary" type="button" onClick={onCancel || (() => navigate('/colors'))} className="me-2" disabled={loading}>
                            Hủy
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />}
                            {isEditMode ? 'Lưu thay đổi' : 'Tạo Màu'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default ColorForm;
