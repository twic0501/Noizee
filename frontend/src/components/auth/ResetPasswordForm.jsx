// src/components/auth/ResetPasswordForm.jsx
import React, { useState } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import AlertMessage from '../common/AlertMessage';

function ResetPasswordForm({ onSubmit, loading = false, error = null, successMessage = null }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!newPassword || !confirmPassword) {
        setFormError("Vui lòng nhập đầy đủ mật khẩu mới và xác nhận.");
        return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Mật khẩu nhập lại không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (onSubmit) {
      onSubmit(newPassword);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="auth-form">
      {error && <AlertMessage variant="danger" className="mb-3 text-start">{error}</AlertMessage>}
      {!error && formError && <AlertMessage variant="danger" className="mb-3 text-start">{formError}</AlertMessage>}
      {successMessage && <AlertMessage variant="success" className="mb-3 text-start">{successMessage}</AlertMessage>}

      <Form.Group className="mb-3" controlId="resetNewPassword">
        <Form.Label>Mật khẩu mới <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="password"
          placeholder="Nhập mật khẩu mới"
          value={newPassword}
          onChange={(e) => {
              setNewPassword(e.target.value);
              if(formError) setFormError('');
          }}
          required
          disabled={loading || !!successMessage}
          autoFocus
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="resetConfirmPassword">
        <Form.Label>Xác nhận mật khẩu mới <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => {
              setConfirmPassword(e.target.value);
              if(formError) setFormError('');
          }}
          required
          disabled={loading || !!successMessage}
        />
      </Form.Group>

      <div className="d-grid">
        <Button variant="dark" type="submit" disabled={loading || !newPassword || !confirmPassword || !!successMessage} className="auth-submit-btn">
          {loading ? (
            <><Spinner as="span" animation="border" size="sm" className="me-1" /> Đang lưu...</>
          ) : 'Đặt lại mật khẩu'}
        </Button>
      </div>
    </Form>
  );
}

export default ResetPasswordForm;