// src/components/auth/AuthForm.jsx
import React, { useState } from 'react';
import { Form, Button, Spinner, Row, Col } from 'react-bootstrap';
import AlertMessage from '../common/AlertMessage';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
// import './AuthForm.css';

function AuthForm({ isRegister = false, onSubmit, loading = false, error = null, successMessage = null }) {
  const { t } = useTranslation(); // << SỬ DỤNG HOOK

  const [formData, setFormData] = useState({
    identifier: '',
    customer_name: '',
    username: '',
    customer_email: '',
    customer_password: '',
    confirmPassword: '',
    customer_tel: '',
    customer_address: '',
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
    // Clear server error if user types in other fields
    // Consider a more sophisticated way to clear server errors
  };

  const validateForm = () => {
    if (isRegister) {
      const { customer_name, customer_email, customer_password, confirmPassword, customer_tel, username } = formData;
      if (!customer_name.trim() || !customer_email.trim() || !customer_password || !customer_tel.trim()) {
        setFormError(t('authForm.requiredFieldsError'));
        return false;
      }
      if (customer_password !== confirmPassword) {
        setFormError(t('authForm.passwordMismatchError'));
        return false;
      }
      if (customer_password.length < 6) {
        setFormError(t('authForm.passwordMinLengthError'));
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer_email.trim())) {
          setFormError(t('authForm.invalidEmailError'));
          return false;
      }
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(customer_tel.trim())) {
          setFormError(t('authForm.invalidPhoneError'));
          return false;
      }
      if (username.trim() && (username.trim().length < 3 || /\s/.test(username.trim()))) {
          setFormError(t('authForm.invalidUsernameError'));
          return false;
      }
    } else { // Login
      const { identifier, customer_password } = formData;
      if (!identifier.trim() || !customer_password) {
        setFormError(t('authForm.loginFieldsRequiredError'));
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

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
    <Form onSubmit={handleSubmit} className="auth-form">
      {error && <AlertMessage variant="danger" className="mb-3 text-start">{error}</AlertMessage>}
      {!error && formError && <AlertMessage variant="danger" className="mb-3 text-start">{formError}</AlertMessage>}
      {successMessage && <AlertMessage variant="success" className="mb-3 text-start">{successMessage}</AlertMessage>}

      {isRegister && (
        <>
          <Form.Group className="mb-3" controlId="authFormName">
            <Form.Label>{t('authForm.nameLabel')} <span className="text-danger">*</span></Form.Label>
            <Form.Control type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required disabled={loading} autoFocus={isRegister} />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="authFormEmailRegister">
                <Form.Label>{t('authForm.emailLabel')} <span className="text-danger">*</span></Form.Label>
                <Form.Control type="email" name="customer_email" value={formData.customer_email} onChange={handleChange} required disabled={loading}/>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="authFormUsername">
                <Form.Label>{t('authForm.usernameLabel')}</Form.Label>
                <Form.Control type="text" name="username" placeholder={t('authForm.usernamePlaceholder')} value={formData.username} onChange={handleChange} disabled={loading} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="authFormPhone">
            <Form.Label>{t('authForm.phoneLabel')} <span className="text-danger">*</span></Form.Label>
            <Form.Control type="tel" name="customer_tel" value={formData.customer_tel} onChange={handleChange} required disabled={loading}/>
          </Form.Group>
          <Form.Group className="mb-3" controlId="authFormAddress">
            <Form.Label>{t('authForm.addressLabel')}</Form.Label>
            <Form.Control type="text" name="customer_address" placeholder={t('authForm.addressPlaceholder')} value={formData.customer_address} onChange={handleChange} disabled={loading} />
          </Form.Group>
        </>
      )}

      {!isRegister && (
        <Form.Group className="mb-3" controlId="authFormIdentifier">
          <Form.Label>{t('authForm.loginIdentifierLabel')}</Form.Label>
          <Form.Control type="text" name="identifier" placeholder={t('authForm.loginIdentifierPlaceholder')} value={formData.identifier} onChange={handleChange} required disabled={loading} autoFocus={!isRegister} />
        </Form.Group>
      )}

      <Form.Group className="mb-3" controlId="authFormPassword">
        <Form.Label>{t('authForm.passwordLabel')} <span className="text-danger">*</span></Form.Label>
        <Form.Control type="password" name="customer_password" placeholder={t('authForm.passwordPlaceholder')} value={formData.customer_password} onChange={handleChange} required disabled={loading} />
      </Form.Group>

      {isRegister && (
        <Form.Group className="mb-3" controlId="authFormConfirmPassword">
          <Form.Label>{t('authForm.confirmPasswordLabel')} <span className="text-danger">*</span></Form.Label>
          <Form.Control type="password" name="confirmPassword" placeholder={t('authForm.confirmPasswordPlaceholder')} value={formData.confirmPassword} onChange={handleChange} required disabled={loading} />
        </Form.Group>
      )}

      <div className="d-grid">
        <Button variant="dark" type="submit" disabled={loading} className="auth-submit-btn">
          {loading ? (
            <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> {t('authForm.processing')}</>
          ) : (isRegister ? t('authForm.registerButton') : t('authForm.loginButton'))}
        </Button>
      </div>
    </Form>
  );
}

export default AuthForm;