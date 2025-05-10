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
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }
    if (onSubmit) {
      onSubmit(newPassword);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Hiển thị lỗi hoặc thành công */}
      {error && <AlertMessage variant="danger">{error}</AlertMessage>}
      {formError && <AlertMessage variant="danger">{formError}</AlertMessage>}
      {successMessage && <AlertMessage variant="success">{successMessage}</AlertMessage>}

      <Form.Group className="mb-3" controlId="resetNewPassword">
        <Form.Label>New Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={loading || !!successMessage}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="resetConfirmPassword">
        <Form.Label>Confirm New Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading || !!successMessage}
        />
      </Form.Group>

      <div className="d-grid">
        <Button variant="dark" type="submit" disabled={loading || !newPassword || !confirmPassword || !!successMessage}>
          {loading ? (
            <><Spinner as="span" animation="border" size="sm" /> Resetting...</>
          ) : 'Reset Password'}
        </Button>
      </div>
    </Form>
  );
}

export default ResetPasswordForm;