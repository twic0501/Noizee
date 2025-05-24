// src/components/auth/ForgotPasswordForm.jsx
import React, { useState } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import AlertMessage from '../common/AlertMessage';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation

function ForgotPasswordForm({ onSubmit, loading = false, error = null, successMessage = null }) {
  const { t } = useTranslation(); // << SỬ DỤNG HOOK
  const [email, setEmail] = useState('');
  const [clientError, setClientError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setClientError('');
    if (!email.trim()) {
        setClientError(t('forgotPasswordForm.emailRequired'));
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        setClientError(t('forgotPasswordForm.invalidEmail'));
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
        <Form.Label>{t('forgotPasswordForm.emailLabel')}</Form.Label>
        <Form.Control
          type="email"
          placeholder={t('forgotPasswordForm.emailPlaceholder')}
          value={email}
          onChange={(e) => {
              setEmail(e.target.value);
              if (clientError) setClientError('');
          }}
          required
          disabled={loading || !!successMessage}
          autoFocus
        />
        {!successMessage && (
            <Form.Text className="text-muted">
                {t('forgotPasswordForm.instructions')}
            </Form.Text>
        )}
      </Form.Group>

      <div className="d-grid">
        <Button variant="dark" type="submit" disabled={loading || !email || !!successMessage} className="auth-submit-btn">
          {loading ? (
            <><Spinner as="span" animation="border" size="sm" className="me-1" /> {t('forgotPasswordForm.sending')}</>
          ) : t('forgotPasswordForm.submitButton')}
        </Button>
      </div>
    </Form>
  );
}

export default ForgotPasswordForm;
