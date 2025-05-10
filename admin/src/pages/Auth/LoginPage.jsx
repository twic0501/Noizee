// src/pages/Auth/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Spinner } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import { LOGIN_ADMIN_MUTATION } from '../../api/mutations/authMutations';
import AlertMessage from '../../components/common/AlertMessage';
import logger from '../../utils/logger';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { authState, setAuthInfo } = useAuth();

    useEffect(() => {
        if (authState.token && authState.isAdmin === true) {
            // logger.info("LoginPage: Admin already authenticated, redirecting to dashboard.");
            navigate('/dashboard', { replace: true });
        }
    }, [authState, navigate]);

    const [loginMutation, { loading: mutationLoading }] = useMutation(LOGIN_ADMIN_MUTATION, {
        onError: (err) => {
            // logger.error("GraphQL Login Error (Admin):", err);
            const gqlError = err.graphQLErrors?.[0]?.message || err.networkError?.message || 'Login failed. Please check credentials or network.';
            setErrorMessage(gqlError);
        },
        onCompleted: (data) => {
            // logger.info("Admin login mutation completed. Data:", data);
            if (data.login?.token && data.login.isAdmin === true) {
                // logger.info("Admin login successful for:", data.login.username);
                setAuthInfo({
                    token: data.login.token,
                    isAdmin: data.login.isAdmin,
                    customer_id: data.login.customer_id,
                    customer_name: data.login.customer_name,
                    username: data.login.username,
                    customer_email: data.login.customer_email
                });
                const from = location.state?.from?.pathname || '/dashboard';
                navigate(from, { replace: true });
            } else if (data.login && data.login.isAdmin !== true) {
                // logger.warn("Login successful but user is NOT an admin:", data.login.username);
                setErrorMessage('Access Denied: Administrator privileges required.');
            }
             else {
                // logger.error("Login failed: Invalid response from server (no token or isAdmin flag).", data);
                setErrorMessage('Login failed: Invalid server response.');
            }
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        if (!username || !password) {
            setErrorMessage('Username and password are required.');
            return;
        }
        loginMutation({ variables: { identifier: username, password: password } });
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6} lg={4}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <h3 className="card-title text-center mb-4">Admin Panel Login</h3>
                            {errorMessage && <AlertMessage variant="danger" onClose={() => setErrorMessage('')} dismissible>{errorMessage}</AlertMessage>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="usernameInput">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        autoFocus
                                        disabled={mutationLoading}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="passwordInput">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={mutationLoading}
                                    />
                                </Form.Group>
                                <Button variant="primary" type="submit" className="w-100" disabled={mutationLoading}>
                                    {mutationLoading ? (
                                        <>
                                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Logging in...
                                        </>
                                    ) : (
                                        'Login'
                                    )}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default LoginPage;