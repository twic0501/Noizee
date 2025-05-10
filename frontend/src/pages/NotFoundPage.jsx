// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';

function NotFoundPage() {
    return (
        <Container className="d-flex align-items-center justify-content-center text-center" style={{ minHeight: '80vh' }}>
            <Row>
                <Col>
                    <h1 className="display-1 fw-bold text-muted">404</h1>
                    <p className="fs-3"> <span className="text-danger">Oops!</span> Page not found.</p>
                    <p className="lead text-muted">
                        The page you’re looking for doesn’t exist or has been moved.
                    </p>
                    <Button as={Link} to="/" variant="dark"> {/* CSS */}
                        Go Back Home
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}

export default NotFoundPage;