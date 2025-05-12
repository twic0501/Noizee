// src/pages/Auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import { FORGOT_PASSWORD_MUTATION } from '../../api/graphql/mutations/authMutations';
import './AuthPages.css';

function ForgotPasswordPage() {
    const [message, setMessage] = useState({ type: '', text: '' }); // type: 'success' or 'danger'

    const [forgotPassword, { loading }] = useMutation(FORGOT_PASSWORD_MUTATION, {
        onCompleted: (data) => {
            if (data.forgotPassword?.success) {
                setMessage({ type: 'success', text: data.forgotPassword.message || "Hướng dẫn đặt lại mật khẩu đã được gửi (nếu email tồn tại)!" });
            } else {
                // Backend có thể trả về success: false với một message cụ thể
                setMessage({ type: 'danger', text: data.forgotPassword?.message || "Không thể gửi hướng dẫn. Vui lòng thử lại." });
            }
        },
        onError: (apolloError) => {
            console.error("Forgot Password mutation error:", apolloError.message);
            setMessage({ type: 'danger', text: apolloError.message || "Đã có lỗi xảy ra. Vui lòng thử lại." });
        }
    });

    const handleForgotSubmit = (email) => {
        setMessage({ type: '', text: '' }); // Clear previous messages
        forgotPassword({ variables: { email } });
    };

    return (
        <Container className="d-flex align-items-center justify-content-center auth-page-container">
            <Row className="w-100 justify-content-center">
                <Col md={6} lg={5} xl={4}>
                    <Card className="shadow-lg auth-card">
                        <Card.Body className="p-4 p-md-5">
                             <div className="text-center mb-4">
                                <Link to="/" className="auth-logo-link">
                                    <h1 className="auth-brand-title">NOIZEE</h1>
                                </Link>
                                <h2 className="auth-page-title mt-2">Quên mật khẩu</h2>
                            </div>
                            <p className="text-center text-muted-auth small mb-4">
                                Nhập địa chỉ email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
                            </p>
                            <ForgotPasswordForm
                                onSubmit={handleForgotSubmit}
                                loading={loading}
                                error={message.type === 'danger' ? message.text : null}
                                successMessage={message.type === 'success' ? message.text : null}
                            />
                            <div className="text-center mt-4 auth-links">
                                <Link to="/login" className="text-muted-auth"><small>Quay lại Đăng nhập</small></Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ForgotPasswordPage;