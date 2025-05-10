// src/pages/Settings/AdminAccountsPage.jsx
import React from 'react';
import { useQuery } from '@apollo/client';
import { Container, Row, Col, Button, Table, Badge, Alert } from 'react-bootstrap';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { GET_ADMIN_USERS_QUERY } from '../../api/queries/userQueries'; // Tái sử dụng query
import logger from '../../utils/logger';

function AdminAccountsPage() {
    // Chỉ fetch để hiển thị admin hiện có
    // TODO: Backend query nên có filter { isAdmin: true } nếu GET_ADMIN_USERS_QUERY lấy tất cả user
    const { loading, error, data } = useQuery(GET_ADMIN_USERS_QUERY, {
        variables: { limit: 100, offset: 0 /*, filter: { isAdmin: true } */ }, // Lấy đủ để lọc client-side hoặc backend filter
        fetchPolicy: 'cache-and-network',
        onError: (err) => logger.error("Error fetching admin accounts:", err)
    });

    // Lọc phía client nếu backend chưa hỗ trợ filter isAdmin
    const admins = data?.adminGetAllUsers?.users?.filter(user => user.isAdmin === true) || [];

    const handleAddAdmin = () => {
        alert("Functionality to add new admin requires backend implementation and security considerations.");
    };

    return (
        <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0">Manage Admin Accounts</h1></Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleAddAdmin} disabled>
                        <i className="bi bi-person-plus-fill me-1"></i> Add New Admin
                    </Button>
                </Col>
            </Row>
            <Alert variant="info">
                Adding, editing, or deleting admin accounts requires careful backend API implementation and robust security checks. Only existing administrators are listed below.
            </Alert>

            {loading && <LoadingSpinner message="Loading administrators..." />}
            {error && !loading && <AlertMessage variant="danger">Error loading admin accounts: {error.message}</AlertMessage>}

            {!loading && !error && (
                admins.length > 0 ? (
                    <Table striped bordered hover responsive size="sm" className="shadow-sm">
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                {/* <th>Actions</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map((admin) => (
                                <tr key={admin.customer_id}>
                                    <td>{admin.customer_id}</td>
                                    <td>{admin.customer_name}</td>
                                    <td>{admin.username || <span className="text-muted">N/A</span>}</td>
                                    <td>{admin.customer_email}</td>
                                    <td>{admin.customer_tel || <span className="text-muted">N/A</span>}</td>
                                    <td><Badge bg="success" pill>Admin</Badge></td>
                                    {/* Actions (edit role, delete admin) disabled - cần API & logic */}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <AlertMessage variant="secondary" className="mt-3">No administrators found.</AlertMessage>
                )
            )}
        </Container>
    );
}

export default AdminAccountsPage;