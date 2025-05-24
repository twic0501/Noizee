// src/components/auth/ResetPasswordForm.jsx
import React, { useState } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import AlertMessage from '../common/AlertMessage';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation

function ResetPasswordForm({ onSubmit, loading = false, error = null, successMessage = null }) {
  const { t } = useTranslation(); // << SỬ DỤNG HOOK
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!newPassword || !confirmPassword) {
        setFormError(t('resetPasswordForm.passwordRequired'));
        return;
    }
    if (newPassword !== confirmPassword) {
      setFormError(t('resetPasswordForm.passwordMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      setFormError(t('resetPasswordForm.passwordMinLength'));
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
        <Form.Label>{t('resetPasswordForm.newPasswordLabel')} <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="password"
          placeholder={t('resetPasswordForm.newPasswordPlaceholder')}
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
        <Form.Label>{t('resetPasswordForm.confirmPasswordLabel')} <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="password"
          placeholder={t('resetPasswordForm.confirmPasswordPlaceholder')}
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
            <><Spinner as="span" animation="border" size="sm" className="me-1" /> {t('resetPasswordForm.saving')}</>
          ) : t('resetPasswordForm.submitButton')}
        </Button>
      </div>
    </Form>
  );
}

export default ResetPasswordForm;
