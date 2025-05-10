// src/pages/Settings/GeneralSettingsPage.jsx
import React from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

function GeneralSettingsPage() {
    // TODO: Fetch current settings if available from backend API
    // TODO: Implement mutation to save settings when backend API exists

    const handleSubmit = (e) => {
        e.preventDefault();
        // Gọi mutation để lưu settings (khi có API)
        alert("Save settings functionality requires backend implementation.");
    };

    return (
        <Container fluid className="p-3">
            <h1 className="h3 mb-3">General Settings</h1>
            <Alert variant="info">
                Saving general settings requires backend implementation. This page is a placeholder for the form structure.
            </Alert>
            <Card className="shadow-sm">
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        {/* Ví dụ các trường cài đặt */}
                        <Form.Group as={Row} className="mb-3" controlId="storeName">
                            <Form.Label column sm={3}>Store Name</Form.Label>
                            <Col sm={9}>
                                <Form.Control type="text" placeholder="Your Store Name" />
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="mb-3" controlId="storeEmail">
                            <Form.Label column sm={3}>Contact Email</Form.Label>
                            <Col sm={9}>
                                <Form.Control type="email" placeholder="contact@yourstore.com" />
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="mb-3" controlId="storePhone">
                            <Form.Label column sm={3}>Phone Number</Form.Label>
                            <Col sm={9}>
                                <Form.Control type="tel" placeholder="Store Phone" />
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="mb-3" controlId="storeAddress">
                            <Form.Label column sm={3}>Address</Form.Label>
                            <Col sm={9}>
                                <Form.Control as="textarea" rows={3} placeholder="Store Address" />
                            </Col>
                        </Form.Group>
                        {/* Thêm các cài đặt khác nếu cần: currency, timezone, etc. */}
                        <hr />
                        <Row>
                            <Col sm={{ span: 9, offset: 3 }}>
                                <Button variant="primary" type="submit" disabled> {/* Tạm thời disable */}
                                    Save Settings
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default GeneralSettingsPage;