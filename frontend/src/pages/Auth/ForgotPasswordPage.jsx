// src/pages/Auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom'; // Thêm useParams
import { useMutation } from '@apollo/client';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm'; // Component này đã được dịch
import { FORGOT_PASSWORD_MUTATION } from '../../api/graphql/mutations/authMutations';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './AuthPages.css';

function ForgotPasswordPage() {
    const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
    const params = useParams();
    const currentLang = params.lang || i18n.language || 'vi';
    const [message, setMessage] = useState({ type: '', text: '' });

    const [forgotPassword, { loading }] = useMutation(FORGOT_PASSWORD_MUTATION, {
        onCompleted: (data) => {
            if (data.forgotPassword?.success) {
                // Sử dụng key dịch cho success message, backend chỉ cần trả về success: true
                setMessage({ type: 'success', text: t('forgotPasswordPage.successMessageDefault') });
            } else {
                // Backend có thể trả về message lỗi cụ thể, hoặc frontend hiển thị lỗi chung
                setMessage({ type: 'danger', text: data.forgotPassword?.message || t('forgotPasswordPage.errorMessageDefault') });
            }
        },
        onError: (apolloError) => {
            console.error("Forgot Password mutation error:", apolloError.message);
            setMessage({ type: 'danger', text: apolloError.message || t('common.error') });
        }
    });

    const handleForgotSubmit = (email) => {
        setMessage({ type: '', text: '' });
        forgotPassword({ variables: { email } });
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
                                <h2 className="auth-page-title mt-2">{t('forgotPasswordPage.title')}</h2>
                            </div>
                            <p className="text-center text-muted-auth small mb-4">
                                {t('forgotPasswordPage.instructions')}
                            </p>
                            <ForgotPasswordForm
                                onSubmit={handleForgotSubmit}
                                loading={loading}
                                error={message.type === 'danger' ? message.text : null}
                                successMessage={message.type === 'success' ? message.text : null}
                            />
                            <div className="text-center mt-4 auth-links">
                                <Link to={langLink("/login")} className="text-muted-auth">
                                    <small>{t('forgotPasswordPage.backToLoginLink')}</small>
                                </Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ForgotPasswordPage;