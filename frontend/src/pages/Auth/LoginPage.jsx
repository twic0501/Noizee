// src/pages/Auth/LoginPage.jsx
import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import AuthForm from '../../components/auth/AuthForm';
import { LOGIN_MUTATION } from '../../api/graphql/mutations/authMutations';
import { useAuth } from '../../hooks/useAuth';
import AlertMessage from '@noizee/ui-components';

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [loginUser, { loading, error }] = useMutation(LOGIN_MUTATION, {
         onCompleted: (data) => {
             if (data.login?.token && data.login) {
                 login(data.login.token, data.login); // Lưu token và user info
                 const from = location.state?.from?.pathname || '/'; // Chuyển về trang trước đó hoặc trang chủ
                 navigate(from, { replace: true });
             } else {
                  // Xử lý trường hợp backend không trả token (dù không có lỗi GQL)
                 console.error("Login completed but no token received:", data);
             }
         },
         onError: (err) => {
             console.error("Login error:", err);
             // Lỗi đã được hiển thị bởi AuthForm thông qua prop `error`
         }
    });

     const handleLoginSubmit = (formData) => {
         loginUser({ variables: { identifier: formData.identifier, password: formData.customer_password } });
     };

    return (
         <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
             <Row className="w-100">
                <Col md={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
                     <Card className="shadow-sm">
                        <Card.Body className="p-4">
                             <h2 className="text-center mb-4 auth-title">Login</h2> {/* CSS */}
                             <AuthForm
                                isRegister={false}
                                onSubmit={handleLoginSubmit}
                                loading={loading}
                                error={error?.message} // Chỉ truyền message lỗi
                             />
                             <div className="text-center mt-3">
                                <Link to="/forgot-password" className="text-muted me-3"><small>Forgot Password?</small></Link>
                                <Link to="/register" className="text-muted"><small>Don't have an account? Register</small></Link>
                             </div>
                        </Card.Body>
                     </Card>
                </Col>
             </Row>
         </Container>
     );
}
export default LoginPage;