// src/pages/Auth/RegisterPage.jsx
import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom'; // Thêm useParams
import { useMutation } from '@apollo/client';
import AuthForm from '../../components/auth/AuthForm'; // AuthForm đã được dịch
import { REGISTER_MUTATION } from '../../api/graphql/mutations/authMutations';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './AuthPages.css';

function RegisterPage() {
    const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
    const navigate = useNavigate();
    const params = useParams();
    const { login } = useAuth();
    const currentLang = params.lang || i18n.language || 'vi';

    const [registerUser, { loading, error }] = useMutation(REGISTER_MUTATION, {
        onCompleted: (data) => {
            if (data.register?.token && data.register) {
                login(data.register.token, data.register);
                navigate(`/${currentLang}/account`, { replace: true }); // Điều hướng đến tài khoản với prefix ngôn ngữ
            }
        },
        onError: (apolloError) => {
            console.error("Register mutation error:", apolloError.message);
        }
    });

    const handleRegisterSubmit = (formData) => {
        registerUser({ variables: { input: formData } });
    };
    
    const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');

    return (
        <Container className="d-flex align-items-center justify-content-center auth-page-container">
            <Row className="w-100 justify-content-center">
                 <Col md={7} lg={6} xl={5}>
                    <Card className="shadow-lg auth-card">
                        <Card.Body className="p-4 p-md-5">
                            <div className="text-center mb-4">
                                <Link to={langLink("/")} className="auth-logo-link">
                                    <h1 className="auth-brand-title">NOIZEE</h1>
                                </Link>
                                <h2 className="auth-page-title mt-2">{t('registerPage.title')}</h2>
                            </div>
                            <AuthForm
                                isRegister={true}
                                onSubmit={handleRegisterSubmit}
                                loading={loading}
                                error={error?.message}
                            />
                            <div className="text-center mt-4 auth-links">
                                <Link to={langLink("/login")} className="text-muted-auth">
                                    <small>{t('registerPage.loginLink')}</small>
                                </Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default RegisterPage;