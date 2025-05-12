// src/components/auth/ForgotPasswordForm.jsx
import React, { useState } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import AlertMessage from '../common/AlertMessage';

function ForgotPasswordForm({ onSubmit, loading = false, error = null, successMessage = null }) {
  const [email, setEmail] = useState('');
  const [clientError, setClientError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setClientError('');
    if (!email.trim()) {
        setClientError("Vui lòng nhập địa chỉ email của bạn.");
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        setClientError("Định dạng email không hợp lệ.");
        return;
    }
    if (onSubmit) {
      onSubmit(email.trim());
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="auth-form">
      {error && <AlertMessage variant="danger" className="mb-3 text-start">{error}</AlertMessage>}
      {!error && clientError && <AlertMessage variant="danger" className="mb-3 text-start">{clientError}</AlertMessage>}
      {successMessage && <AlertMessage variant="success" className="mb-3 text-start">{successMessage}</AlertMessage>}

      <Form.Group className="mb-3" controlId="forgotPasswordEmail">
        <Form.Label>Địa chỉ Email</Form.Label>
        <Form.Control
          type="email"
          placeholder="Nhập email đã đăng ký"
          value={email}
          onChange={(e) => {
              setEmail(e.target.value);
              if (clientError) setClientError('');
              // Clear server error/success when user types
              // if (error || successMessage) {
              //    // This should be handled by parent if message needs to persist until new submit
              // }
          }}
          required
          disabled={loading || !!successMessage}
          autoFocus
        />
        {!successMessage && (
            <Form.Text className="text-muted">
                Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu đến email này nếu nó đã được đăng ký.
            </Form.Text>
        )}
      </Form.Group>

      <div className="d-grid">
        <Button variant="dark" type="submit" disabled={loading || !email || !!successMessage} className="auth-submit-btn">
          {loading ? (
            <><Spinner as="span" animation="border" size="sm" className="me-1" /> Đang gửi...</>
          ) : 'Gửi hướng dẫn'}
        </Button>
      </div>
    </Form>
  );
}

export default ForgotPasswordForm;