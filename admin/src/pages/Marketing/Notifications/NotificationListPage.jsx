// src/pages/Marketing/Notifications/NotificationListPage.jsx
import React from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';

function NotificationListPage() {
    // TODO: Implement fetching notifications when backend API is ready
    // TODO: Implement Add/Edit/Delete functionality and modals/forms
    const handleAddNotification = () => {
        alert("Functionality to add new notification requires backend implementation.");
    };

    return (
        <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0">Manage Notifications</h1></Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleAddNotification} disabled> {/* Tạm thời disable */}
                        <i className="bi bi-plus-lg me-1"></i> Add New Notification
                    </Button>
                </Col>
            </Row>

            <Alert variant="info">
                Notification management feature requires backend implementation. This page is a placeholder.
            </Alert>
            {/* Placeholder for table */}
            {/* <NotificationTable notifications={[]} onEdit={() => {}} onDelete={() => {}} /> */}
            <p className="text-muted">Notifications will be listed here once the backend API is available.</p>
        </Container>
    );
}

export default NotificationListPage;