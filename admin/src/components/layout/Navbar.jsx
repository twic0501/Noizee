import React from 'react';
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap'; // Hoặc dùng class Bootstrap thường
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Hook để lấy thông tin auth và logout

function AdminNavbar() {
    const { authState, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); // Gọi hàm logout từ context
        navigate('/login'); // Điều hướng về trang login
    };

    // Lấy tên admin từ localStorage hoặc authState nếu có
    const adminName = localStorage.getItem('admin_name') || authState.adminName || 'Admin';

    return (
        <Navbar bg="light" expand="lg" className="shadow-sm">
            <Container fluid>
                {/* Nút Toggle Sidebar cho màn hình nhỏ (cần thêm logic state ở layout cha) */}
                {/* <Navbar.Toggle aria-controls="sidebar" /> */}
                <Navbar.Brand as={Link} to="/dashboard">Admin Dashboard</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                    <Nav>
                        <NavDropdown title={adminName} id="admin-nav-dropdown" align="end">
                            <NavDropdown.Item as={Link} to="/profile">My Profile</NavDropdown.Item> {/* Nếu có trang profile admin */}
                            <NavDropdown.Item as={Link} to="/settings">Settings</NavDropdown.Item> {/* Nếu có trang settings */}
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={handleLogout}>
                                Logout
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default AdminNavbar;