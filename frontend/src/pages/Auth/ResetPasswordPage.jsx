// src/pages/Auth/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom'; // Thêm useParams
import { useMutation } from '@apollo/client';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm'; // Component này đã được dịch
import { RESET_PASSWORD_MUTATION } from '../../api/graphql/mutations/authMutations';
import AlertMessage from '../../components/common/AlertMessage';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './AuthPages.css';

function ResetPasswordPage() {
    const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const params = useParams();
    const { login } = useAuth();
    const token = searchParams.get('token');
    const currentLang = params.lang || i18n.language || 'vi';

    const [message, setMessage] = useState({ type: '', text: '' });

    const [resetPassword, { loading }] = useMutation(RESET_PASSWORD_MUTATION, {
        onCompleted: (data) => {
            if (data.resetPassword?.success) {
                setMessage({ type: 'success', text: data.resetPassword.message || t('resetPasswordPage.successMessageDefault') });
                if (data.resetPassword.token && data.resetPassword.customer) {
                    login(data.resetPassword.token, data.resetPassword.customer);
                    setTimeout(() => navigate(langLink("/account"), { replace: true }), 2500);
                } else {
                    setTimeout(() => navigate(langLink("/login"), { replace: true }), 2500);
                }
            } else {
                setMessage({ type: 'danger', text: data.resetPassword?.message || t('resetPasswordPage.errorMessageDefault') });
            }
        },
        onError: (apolloError) => {
            console.error("Reset Password mutation error:", apolloError.message);
            setMessage({ type: 'danger', text: apolloError.message || t('common.error') });
        }
    });

    useEffect(() => {
        if (!token) {
            setMessage({ type: 'danger', text: t('resetPasswordPage.invalidTokenError') });
        }
    }, [token, t]);

    const handleResetSubmit = (newPassword) => {
        if (!token) {
            setMessage({ type: 'danger', text: t('resetPasswordPage.cannotSubmitInvalidTokenError') });
            return;
        }
        setMessage({ type: '', text: '' });
        resetPassword({ variables: { token, newPassword } });
    };

    const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');

    return (
        <Container className="d-flex align-items-center justify-content-center auth-page-container">
            <Row className="w-100 justify-content-center">
                <Col md={6} lg={5} xl={4}>
                    <Card className="shadow-lg auth-card">
                        <Card.Body className="p-4 p-md-5">
                            <div className="text-center mb-4">
                                 <Link to={langLink("/")} className="auth-logo-link">
                                    <h1 className="auth-brand-title">NOIZEE</h1>
                                </Link>
                                <h2 className="auth-page-title mt-2">{t('resetPasswordPage.title')}</h2>
                            </div>

                            {!token && !message.text &&
                                <AlertMessage variant="danger" className="mb-3 text-start">
                                    {t('resetPasswordPage.invalidOrExpiredLinkError')}
                                </AlertMessage>
                            }

                            {(token || message.type === 'danger' ) &&
                                <ResetPasswordForm
                                    onSubmit={handleResetSubmit}
                                    loading={loading}
                                    error={message.type === 'danger' ? message.text : null}
                                    successMessage={message.type === 'success' ? message.text : null}
                                />
                            }
                            {message.type !== 'success' && (
                                <div className="text-center mt-4 auth-links">
                                    <Link to={langLink("/login")} className="text-muted-auth">
                                        <small>{t('resetPasswordPage.backToLoginLink')}</small>
                                    </Link>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ResetPasswordPage;
