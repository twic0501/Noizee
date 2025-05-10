// src/components/auth/ForgotPasswordForm.jsx
import React, { useState } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import AlertMessage from '../common/AlertMessage';

function ForgotPasswordForm({ onSubmit, loading = false, error = null, successMessage = null }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(email);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Hiển thị lỗi hoặc thành công */}
      {error && <AlertMessage variant="danger">{error}</AlertMessage>}
      {successMessage && <AlertMessage variant="success">{successMessage}</AlertMessage>}

      <Form.Group className="mb-3" controlId="forgotPasswordEmail">
        <Form.Label>Enter your email address</Form.Label>
        <Form.Control
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || !!successMessage} // Disable nếu đang gửi hoặc đã thành công
        />
        <Form.Text muted>
          We'll send password reset instructions to this email if it's registered.
        </Form.Text>
      </Form.Group>

      <div className="d-grid">
        <Button variant="dark" type="submit" disabled={loading || !email || !!successMessage}>
          {loading ? (
            <><Spinner as="span" animation="border" size="sm" /> Sending...</>
          ) : 'Send Reset Instructions'}
        </Button>
      </div>
    </Form>
  );
}

export default ForgotPasswordForm;