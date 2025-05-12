// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Image } from 'react-bootstrap'; // Thêm Image
import './NotFoundPage.css'; // Tạo file CSS riêng

function NotFoundPage() {
    return (
        <Container className="d-flex align-items-center justify-content-center text-center not-found-page">
            <Row>
                <Col>
                    {/* Bạn có thể thêm một hình ảnh hoặc icon 404 ở đây */}
                    {/* <Image src="/images/404-graphic.svg" alt="Page not found" fluid className="mb-4 not-found-image" /> */}
                    <h1 className="display-1 fw-bold text-oops">404</h1>
                    <p className="fs-3 title-oops">
                        <span className="text-danger">Oops!</span> Trang không tồn tại.
                    </p>
                    <p className="lead text-muted message-oops">
                        Trang bạn đang tìm kiếm không tồn tại hoặc có thể đã được di chuyển.
                    </p>
                    <Button as={Link} to="/" variant="dark" size="lg" className="go-home-btn mt-3">
                        <i className="bi bi-house-door-fill me-2"></i> Về trang chủ
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}

export default NotFoundPage;