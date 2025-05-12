// src/components/auth/AuthForm.jsx
import React, { useState } from 'react';
import { Form, Button, Spinner, Row, Col } from 'react-bootstrap';
import AlertMessage from '../common/AlertMessage';
// import './AuthForm.css'; // Nếu bạn có CSS riêng cho form này

function AuthForm({ isRegister = false, onSubmit, loading = false, error = null, successMessage = null }) {
  const [formData, setFormData] = useState({
    identifier: '',        // Login (email or username)
    customer_name: '',     // Register
    username: '',          // Optional for Register
    customer_email: '',    // Register
    customer_password: '', // Both
    confirmPassword: '',   // Register only
    customer_tel: '',      // Register
    customer_address: '',  // Register
  });
  const [formError, setFormError] = useState(''); // Client-side validation error

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
    if (error && name !== 'identifier' && name !== 'customer_password') { // Clear server error if user types in other fields
        // Consider a more sophisticated way to clear server errors
    }
  };

  const validateForm = () => {
    if (isRegister) {
      const { customer_name, customer_email, customer_password, confirmPassword, customer_tel, username } = formData;
      if (!customer_name.trim() || !customer_email.trim() || !customer_password || !customer_tel.trim()) {
        setFormError("Vui lòng điền đầy đủ các trường có dấu (*).");
        return false;
      }
      if (customer_password !== confirmPassword) {
        setFormError("Mật khẩu nhập lại không khớp.");
        return false;
      }
      if (customer_password.length < 6) {
        setFormError("Mật khẩu phải có ít nhất 6 ký tự.");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer_email.trim())) {
          setFormError("Định dạng email không hợp lệ.");
          return false;
      }
      const phoneRegex = /^0\d{9}$/; // Ví dụ: 0912345678 (10 số)
      if (!phoneRegex.test(customer_tel.trim())) {
          setFormError("Định dạng số điện thoại không hợp lệ (VD: 0912345678).");
          return false;
      }
      if (username.trim() && (username.trim().length < 3 || /\s/.test(username.trim()))) {
          setFormError("Username (nếu có) phải ít nhất 3 ký tự và không chứa khoảng trắng.");
          return false;
      }
    } else { // Login
      const { identifier, customer_password } = formData;
      if (!identifier.trim() || !customer_password) {
        setFormError("Vui lòng nhập Email/Username và Mật khẩu.");
        return false;
      }
    }
    return true;
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(''); // Reset client error
    // Server error (prop 'error') will be cleared by the parent component if a new submit is successful

    if (!validateForm()) {
        return;
    }

    if (isRegister) {
      onSubmit({
        customer_name: formData.customer_name.trim(),
        username: formData.username.trim() ? formData.username.trim() : null,
        customer_email: formData.customer_email.trim(),
        customer_password: formData.customer_password,
        customer_tel: formData.customer_tel.trim(),
        customer_address: formData.customer_address.trim() ? formData.customer_address.trim() : null,
      });
    } else {
      onSubmit({
        identifier: formData.identifier.trim(),
        customer_password: formData.customer_password,
      });
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="auth-form"> {/* CSS */}
      {/* Ưu tiên hiển thị lỗi từ server (prop 'error'), sau đó là lỗi client */}
      {error && <AlertMessage variant="danger" className="mb-3 text-start">{error}</AlertMessage>}
      {!error && formError && <AlertMessage variant="danger" className="mb-3 text-start">{formError}</AlertMessage>}
      {successMessage && <AlertMessage variant="success" className="mb-3 text-start">{successMessage}</AlertMessage>}

      {isRegister && (
        <>
          <Form.Group className="mb-3" controlId="authFormName">
            <Form.Label>Họ và tên <span className="text-danger">*</span></Form.Label>
            <Form.Control type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required disabled={loading} autoFocus={isRegister} />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="authFormEmailRegister">
                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                <Form.Control type="email" name="customer_email" value={formData.customer_email} onChange={handleChange} required disabled={loading}/>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="authFormUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control type="text" name="username" placeholder="Tên đăng nhập (tùy chọn)" value={formData.username} onChange={handleChange} disabled={loading} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="authFormPhone">
            <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
            <Form.Control type="tel" name="customer_tel" value={formData.customer_tel} onChange={handleChange} required disabled={loading}/>
          </Form.Group>
          <Form.Group className="mb-3" controlId="authFormAddress">
            <Form.Label>Địa chỉ</Form.Label>
            <Form.Control type="text" name="customer_address" placeholder="Địa chỉ nhận hàng (tùy chọn)" value={formData.customer_address} onChange={handleChange} disabled={loading} />
          </Form.Group>
        </>
      )}

      {!isRegister && (
        <Form.Group className="mb-3" controlId="authFormIdentifier">
          <Form.Label>Email hoặc Username</Form.Label>
          <Form.Control type="text" name="identifier" placeholder="Nhập email hoặc username" value={formData.identifier} onChange={handleChange} required disabled={loading} autoFocus={!isRegister} />
        </Form.Group>
      )}

      <Form.Group className="mb-3" controlId="authFormPassword">
        <Form.Label>Mật khẩu <span className="text-danger">*</span></Form.Label>
        <Form.Control type="password" name="customer_password" placeholder="Mật khẩu" value={formData.customer_password} onChange={handleChange} required disabled={loading} />
      </Form.Group>

      {isRegister && (
        <Form.Group className="mb-3" controlId="authFormConfirmPassword">
          <Form.Label>Xác nhận mật khẩu <span className="text-danger">*</span></Form.Label>
          <Form.Control type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={handleChange} required disabled={loading} />
        </Form.Group>
      )}

      <div className="d-grid">
        <Button variant="dark" type="submit" disabled={loading} className="auth-submit-btn">
          {loading ? (
            <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> Đang xử lý...</>
          ) : (isRegister ? 'Đăng ký' : 'Đăng nhập')}
        </Button>
      </div>
    </Form>
  );
}

export default AuthForm;