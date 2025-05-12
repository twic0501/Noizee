// src/pages/Auth/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import { RESET_PASSWORD_MUTATION } from '../../api/graphql/mutations/authMutations';
import AlertMessage from '../../components/common/AlertMessage'; // Dùng AlertMessage chung
import { useAuth } from '../../hooks/useAuth';
import './AuthPages.css';

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const token = searchParams.get('token');

    const [message, setMessage] = useState({ type: '', text: '' });

    const [resetPassword, { loading }] = useMutation(RESET_PASSWORD_MUTATION, {
        onCompleted: (data) => {
            if (data.resetPassword?.success) {
                setMessage({ type: 'success', text: data.resetPassword.message || "Đặt lại mật khẩu thành công!" });
                // Tự động đăng nhập nếu backend trả về token và user info
                if (data.resetPassword.token && data.resetPassword.customer) {
                    login(data.resetPassword.token, data.resetPassword.customer);
                    setTimeout(() => navigate('/account', { replace: true }), 2500); // Chuyển về account sau khi đăng nhập
                } else {
                    setTimeout(() => navigate('/login', { replace: true }), 2500); // Hoặc về login nếu không tự động login
                }
            } else {
                setMessage({ type: 'danger', text: data.resetPassword?.message || "Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn hoặc không hợp lệ." });
            }
        },
        onError: (apolloError) => {
            console.error("Reset Password mutation error:", apolloError.message);
            setMessage({ type: 'danger', text: apolloError.message || "Đã có lỗi xảy ra. Vui lòng thử lại hoặc yêu cầu liên kết mới." });
        }
    });

    useEffect(() => {
        if (!token) {
            setMessage({ type: 'danger', text: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc bị thiếu.' });
        }
    }, [token]);

    const handleResetSubmit = (newPassword) => {
        if (!token) {
            setMessage({ type: 'danger', text: 'Không thể thực hiện. Token không hợp lệ.' });
            return;
        }
        setMessage({ type: '', text: '' }); // Clear previous messages
        resetPassword({ variables: { token, newPassword } });
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
                                <h2 className="auth-page-title mt-2">Đặt lại mật khẩu</h2>
                            </div>

                            {!token && !message.text && /* Chỉ hiển thị khi chưa có lỗi nào khác */
                                <AlertMessage variant="danger" className="mb-3 text-start">
                                    Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu một liên kết mới.
                                </AlertMessage>
                            }

                            {(token || message.type === 'danger' ) &&  /* Hiển thị form nếu có token hoặc có lỗi để user thấy */
                                <ResetPasswordForm
                                    onSubmit={handleResetSubmit}
                                    loading={loading}
                                    error={message.type === 'danger' ? message.text : null}
                                    successMessage={message.type === 'success' ? message.text : null}
                                />
                            }
                             {/* Chỉ hiển thị nút Back to login nếu chưa thành công */}
                            {message.type !== 'success' && (
                                <div className="text-center mt-4 auth-links">
                                    <Link to="/login" className="text-muted-auth"><small>Quay lại Đăng nhập</small></Link>
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