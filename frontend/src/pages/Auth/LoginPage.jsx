// src/pages/Auth/LoginPage.jsx
import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import AuthForm from '../../components/auth/AuthForm';
import { LOGIN_MUTATION } from '../../api/graphql/mutations/authMutations';
import { useAuth } from '../../hooks/useAuth';
import './AuthPages.css'; // Import CSS chung cho các trang Auth

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth(); // Lấy hàm login từ AuthContext

    const [loginUser, { loading, error }] = useMutation(LOGIN_MUTATION, {
        onCompleted: (data) => {
            if (data.login?.token && data.login) {
                // data.login chính là AuthPayload từ GraphQL
                login(data.login.token, data.login); // Lưu token và toàn bộ user info
                const from = location.state?.from?.pathname || '/account'; // Ưu tiên về trang account
                navigate(from, { replace: true });
            } else {
                // Trường hợp này ít khi xảy ra nếu GraphQL schema chặt chẽ
                // và resolver luôn trả về đúng cấu trúc hoặc lỗi.
                // Lỗi sẽ được bắt ở onError.
                console.error("Login completed but no token/user data received:", data);
                // Không nên set lỗi ở đây vì error prop của AuthForm đã xử lý
            }
        },
        onError: (apolloError) => {
            // Lỗi từ Apollo (network, GraphQL errors) sẽ được truyền xuống AuthForm qua prop `error`
            console.error("Login mutation error:", apolloError.message);
        }
    });

    const handleLoginSubmit = (formData) => {
        // formData từ AuthForm đã được trim()
        loginUser({ variables: { identifier: formData.identifier, password: formData.customer_password } });
    };

    return (
        <Container className="d-flex align-items-center justify-content-center auth-page-container">
            <Row className="w-100 justify-content-center">
                <Col md={6} lg={5} xl={4}>
                    <Card className="shadow-lg auth-card">
                        <Card.Body className="p-4 p-md-5">
                            <div className="text-center mb-4">
                                 <Link to="/" className="auth-logo-link">
                                    {/* <img src="/path-to-your-logo.svg" alt="Noizee Logo" className="auth-logo" /> */}
                                    <h1 className="auth-brand-title">NOIZEE</h1>
                                </Link>
                                <h2 className="auth-page-title mt-2">Đăng nhập</h2>
                            </div>
                            <AuthForm
                                isRegister={false}
                                onSubmit={handleLoginSubmit}
                                loading={loading}
                                error={error?.message} // Chỉ truyền message lỗi
                            />
                            <div className="text-center mt-4 auth-links">
                                <Link to="/forgot-password" className="text-muted-auth me-3"><small>Quên mật khẩu?</small></Link>
                                <Link to="/register" className="text-muted-auth"><small>Chưa có tài khoản? Đăng ký</small></Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default LoginPage;