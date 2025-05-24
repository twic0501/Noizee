// src/pages/Auth/LoginPage.jsx
import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'; // Thêm useParams
import { useMutation } from '@apollo/client';
import AuthForm from '../../components/auth/AuthForm'; // AuthForm đã được dịch
import { LOGIN_MUTATION } from '../../api/graphql/mutations/authMutations';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './AuthPages.css';

function LoginPage() {
    const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams(); // Để lấy lang từ URL nếu cần (mặc dù trang này thường không có /:lang)
    const { login } = useAuth();
    
    // Xác định ngôn ngữ hiện tại để điều hướng sau khi login
    const currentLang = params.lang || i18n.language || 'vi';

    const [loginUser, { loading, error }] = useMutation(LOGIN_MUTATION, {
        onCompleted: (data) => {
            if (data.login?.token && data.login) {
                login(data.login.token, data.login);
                // Điều hướng đến trang tài khoản với prefix ngôn ngữ
                const from = location.state?.from?.pathname;
                // Nếu 'from' đã có prefix ngôn ngữ, giữ nguyên, nếu không, thêm prefix
                const destination = from ? (from.startsWith(`/${currentLang}`) ? from : `/${currentLang}${from}`) : `/${currentLang}/account`;
                navigate(destination.replace(/\/+/g, '/'), { replace: true });
            }
        },
        onError: (apolloError) => {
            console.error("Login mutation error:", apolloError.message);
        }
    });

    const handleLoginSubmit = (formData) => {
        loginUser({ variables: { identifier: formData.identifier, password: formData.customer_password } });
    };

    // Helper để tạo link với prefix ngôn ngữ
    const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');

    return (
        <Container className="d-flex align-items-center justify-content-center auth-page-container">
            <Row className="w-100 justify-content-center">
                <Col md={6} lg={5} xl={4}>
                    <Card className="shadow-lg auth-card">
                        <Card.Body className="p-4 p-md-5">
                            <div className="text-center mb-4">
                                 <Link to={langLink("/")} className="auth-logo-link"> {/* Link về trang chủ theo ngôn ngữ */}
                                    <h1 className="auth-brand-title">NOIZEE</h1>
                                </Link>
                                <h2 className="auth-page-title mt-2">{t('loginPage.title')}</h2>
                            </div>
                            <AuthForm
                                isRegister={false}
                                onSubmit={handleLoginSubmit}
                                loading={loading}
                                error={error?.message} // AuthForm sẽ tự dịch các lỗi client-side
                            />
                            <div className="text-center mt-4 auth-links">
                                <Link to={langLink("/forgot-password")} className="text-muted-auth me-3">
                                    <small>{t('loginPage.forgotPasswordLink')}</small>
                                </Link>
                                <Link to={langLink("/register")} className="text-muted-auth">
                                    <small>{t('loginPage.registerLink')}</small>
                                </Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default LoginPage;