// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';

function NotFoundPage() {
    return (
        <Container className="py-5 text-center d-flex flex-column justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 120px)'}}> {/* Giả sử header/footer ~120px */}
            <Row className="justify-content-center">
                <Col md={8}>
                    <h1 className="display-1 fw-bold text-primary">404</h1>
                    <p className="fs-3">
                        <span className="text-danger">Oops!</span> Page Not Found.
                    </p>
                    <p className="lead text-muted">
                        The page you’re looking for doesn’t exist or has been moved.
                    </p>
                    <Button as={Link} to="/dashboard" variant="dark" className="mt-3">
                        <i className="bi bi-house-door-fill me-2"></i>
                        Go to Dashboard
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}

export default NotFoundPage;