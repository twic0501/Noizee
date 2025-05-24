// src/pages/NotFoundPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import FuzzyText from '../components/common/FuzzyText';
import LanyardCanvas from '../components/common/Lanyard'; // Import LanyardCanvas
import './NotFoundPage.css';

function NotFoundPage() {
    const { t, i18n } = useTranslation();
    const params = useParams();
    const navigate = useNavigate(); // For Lanyard navigation
    const currentLang = params.lang || i18n.language || 'vi';
    const homePath = `/${currentLang}`.replace(/\/+/g, '/');
    const newsPath = `the-noizee`; // Or your actual "news/latest products" path without lang prefix

    const [fuzzyTextColor, setFuzzyTextColor] = useState('#212529');

    useEffect(() => {
        // Get CSS variable after component mounts
        if (typeof window !== 'undefined') {
            const color = getComputedStyle(document.documentElement).getPropertyValue('--color-text-base').trim() || '#212529';
            setFuzzyTextColor(color);
        }
    }, []);

    return (
        <Container fluid className="p-0 d-flex flex-column not-found-page-container">
            {/* Lanyard takes full screen behind everything */}
            <div className="lanyard-background-container">
                <LanyardCanvas 
                    position={[0, -2, 25]} // Adjusted initial camera position
                    gravity={[0, -30, 0]}  // Adjusted gravity
                    fov={25}               // Adjusted FOV
                    transparent={true}
                    onPulledNavigateTo={newsPath} // Path to navigate to when lanyard is pulled
                />
            </div>

            {/* Content overlay */}
            <div className="content-overlay-notfound">
                <Container className="text-center">
                    <Row className="justify-content-center">
                        <Col md={10} lg={8}>
                            <FuzzyText
                                fontSize="clamp(5rem, 20vw, 10rem)"
                                fontWeight={900}
                                fontFamily="'Archivo Black', sans-serif"
                                color={fuzzyTextColor}
                                baseIntensity={0.1}
                                hoverIntensity={0.25}
                                enableHover={true}
                            >
                                404
                            </FuzzyText>
                            
                            <p className="fs-3 title-oops" style={{ fontFamily: "var(--font-family-heading-main)"}}>
                                <span className="text-danger">{t('notFoundPage.oops')}</span> {t('notFoundPage.pageNotFoundTitle')}
                            </p>
                            <p className="lead text-muted message-oops" style={{ fontFamily: "var(--font-family-monospace)"}}>
                                {t('notFoundPage.message')}
                            </p>
                            <Button as={Link} to={homePath} variant="dark" size="lg" className="go-home-btn mt-4">
                                <i className="bi bi-house-door-fill me-2"></i> {t('notFoundPage.goHomeButton')}
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </div>
        </Container>
    );
}

export default NotFoundPage;