// src/pages/Auth/RegisterPage.jsx
import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import AuthForm from '../../components/auth/AuthForm';
import { REGISTER_MUTATION } from '../../api/graphql/mutations/authMutations';
import { useAuth } from '../../hooks/useAuth';
import './AuthPages.css';

function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [registerUser, { loading, error }] = useMutation(REGISTER_MUTATION, {
        onCompleted: (data) => {
            if (data.register?.token && data.register) {
                login(data.register.token, data.register);
                navigate('/account'); // Chuyển về trang tài khoản sau khi đăng ký thành công
            } else {
                console.error("Register completed but no token/user data received:", data);
            }
        },
        onError: (apolloError) => {
            console.error("Register mutation error:", apolloError.message);
        }
    });

    const handleRegisterSubmit = (formData) => {
        // formData từ AuthForm đã được trim() và chuẩn bị
        registerUser({ variables: { input: formData } });
    };

    return (
        <Container className="d-flex align-items-center justify-content-center auth-page-container">
            <Row className="w-100 justify-content-center">
                 <Col md={7} lg={6} xl={5}> {/* Form đăng ký có thể rộng hơn chút */}
                    <Card className="shadow-lg auth-card">
                        <Card.Body className="p-4 p-md-5">
                            <div className="text-center mb-4">
                                <Link to="/" className="auth-logo-link">
                                    <h1 className="auth-brand-title">NOIZEE</h1>
                                </Link>
                                <h2 className="auth-page-title mt-2">Tạo tài khoản</h2>
                            </div>
                            <AuthForm
                                isRegister={true}
                                onSubmit={handleRegisterSubmit}
                                loading={loading}
                                error={error?.message}
                            />
                            <div className="text-center mt-4 auth-links">
                                <Link to="/login" className="text-muted-auth"><small>Đã có tài khoản? Đăng nhập</small></Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default RegisterPage;