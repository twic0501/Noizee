// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import FuzzyText from '../components/common/FuzzyText'; // << KIỂM TRA LẠI ĐƯỜNG DẪN NÀY
import './NotFoundPage.css';

function NotFoundPage() {
    const { t, i18n } = useTranslation();
    const params = useParams();
    const currentLang = params.lang || i18n.language || 'vi';
    const homePath = `/${currentLang}`.replace(/\/+/g, '/');

    // Lấy màu từ CSS variable, nếu không có thì dùng màu xám mặc định
    // Đảm bảo --color-text-base hoặc --color-text-muted được định nghĩa
    const fuzzyTextColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text-base').trim() || '#212529';

    return (
        <Container className="d-flex align-items-center justify-content-center text-center not-found-page">
            <Row>
                <Col>
                    <FuzzyText
                        fontSize="clamp(6rem, 20vw, 12rem)" // Tăng kích thước một chút
                        fontWeight={900}
                        fontFamily="'Archivo Black', sans-serif" // Font cho số 404
                        color={fuzzyTextColor} // Màu cho số 404
                        baseIntensity={0.1}    // Giảm cường độ nhiễu cơ bản
                        hoverIntensity={0.25}  // Giảm cường độ nhiễu khi hover
                        enableHover={true}
                    >
                        404
                    </FuzzyText>
                    
                    <p className="fs-3 title-oops" style={{ fontFamily: "var(--font-family-heading-main)"}}> {/* Áp dụng font cho "Oops!" */}
                        <span className="text-danger">{t('notFoundPage.oops')}</span> {t('notFoundPage.pageNotFoundTitle')}
                    </p>
                    <p className="lead text-muted message-oops" style={{ fontFamily: "var(--font-family-monospace)"}}>
                        {t('notFoundPage.message')}
                    </p>
                    <Button as={Link} to={homePath} variant="dark" size="lg" className="go-home-btn mt-3">
                        <i className="bi bi-house-door-fill me-2"></i> {t('notFoundPage.goHomeButton')}
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}

export default NotFoundPage;
