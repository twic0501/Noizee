// admin-frontend/src/pages/Auth/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Spinner, FloatingLabel } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext'; // Đảm bảo đường dẫn này đúng nếu bạn tạo file useAuth.js riêng
import { ADMIN_LOGIN_MUTATION } from '../../api/mutations/authMutations';
import AlertMessage from '../../components/common/AlertMessage';
import logger from '../../utils/logger';

function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { authState, setAuthInfo, isAdminAuthenticated } = useAuth();

    const [adminLogin, { loading: mutationLoading }] = useMutation(ADMIN_LOGIN_MUTATION, {
        onError: (apolloError) => {
            logger.error("Admin login error (GraphQL):", apolloError);
            const gqlErrorMsg = apolloError.graphQLErrors?.[0]?.message;
            const networkErrorMsg = apolloError.networkError?.message;
            setErrorMessage(gqlErrorMsg || networkErrorMsg || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin hoặc kết nối mạng.');
        },
        onCompleted: (data) => {
            // Log dữ liệu gốc nhận được từ mutation
            console.log("!!! DEBUG LoginPage: Data received from onCompleted:", data);
            logger.info("[LoginPage] Admin login mutation completed. Raw Data:", data);

            // SỬA Ở ĐÂY: Truy cập data.login thay vì data.adminLogin
            if (data && data.login && data.login.token) {
                // Log giá trị isAdmin nhận được từ data.login
                console.log(`!!! DEBUG LoginPage: isAdmin from data.login: ${data.login.isAdmin}, type: ${typeof data.login.isAdmin}`);
                logger.info(`[LoginPage] isAdmin from data.login: ${data.login.isAdmin}, type: ${typeof data.login.isAdmin}`);

                if (data.login.isAdmin === true) { // Kiểm tra isAdmin một cách nghiêm ngặt
                    logger.info("[LoginPage] Admin login successful for:", data.login.username || data.login.customer_email);
                    // Truyền toàn bộ đối tượng data.login vào setAuthInfo
                    setAuthInfo(data.login); // << QUAN TRỌNG

                    const from = location.state?.from?.pathname || '/dashboard';
                    navigate(from, { replace: true });
                } else {
                    // Trường hợp token có, nhưng isAdmin không phải là true (boolean)
                    logger.warn("[LoginPage] Login successful but user is not an admin or isAdmin flag is not boolean true.", { loginData: data.login });
                    setErrorMessage('Bạn không có quyền quản trị.');
                    // Không gọi setAuthInfo nếu không phải admin
                }
            } else {
                // Trường hợp không có token hoặc cấu trúc data.login không đúng
                logger.warn("[LoginPage] Login failed: Invalid response structure or missing token.", { loginData: data?.login });
                setErrorMessage('Thông tin đăng nhập không hợp lệ hoặc phản hồi từ server không đúng.');
            }
        }
    });
    
    useEffect(() => {
        if (isAdminAuthenticated) {
            logger.info("LoginPage: Admin already authenticated, redirecting to dashboard.");
            navigate('/dashboard', { replace: true });
        }
    }, [isAdminAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        if (!identifier || !password) {
            setErrorMessage('Vui lòng nhập tên người dùng/email và mật khẩu.');
            return;
        }
        adminLogin({ variables: { identifier: identifier, password: password } });
    };

    return (
        <Container fluid className="d-flex align-items-center justify-content-center bg-light" style={{ minHeight: '100vh' }}>
            <Row className="w-100" style={{ maxWidth: '450px' }}>
                <Col>
                    <Card className="shadow-lg border-0 rounded-lg">
                        <Card.Header className="text-center bg-dark text-white">
                            <h3 className="my-3 font-weight-light">Admin Panel Login</h3>
                        </Card.Header>
                        <Card.Body className="p-4 p-md-5">
                            {errorMessage && <AlertMessage variant="danger" onClose={() => setErrorMessage('')} dismissible>{errorMessage}</AlertMessage>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formAdminIdentifier">
                                    <FloatingLabel label="Tên người dùng hoặc Email">
                                        <Form.Control
                                            type="text"
                                            placeholder="Nhập tên người dùng hoặc email"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            required
                                            autoFocus
                                            disabled={mutationLoading}
                                        />
                                    </FloatingLabel>
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="formAdminPassword">
                                    <FloatingLabel label="Mật khẩu">
                                        <Form.Control
                                            type="password"
                                            placeholder="Nhập mật khẩu"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={mutationLoading}
                                        />
                                    </FloatingLabel>
                                </Form.Group>

                                <div className="d-grid">
                                    <Button variant="primary" type="submit" disabled={mutationLoading} size="lg">
                                        {mutationLoading ? (
                                            <>
                                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                                <span className="ms-2">Đang đăng nhập...</span>
                                            </>
                                        ) : (
                                            'Đăng nhập'
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default LoginPage;
    