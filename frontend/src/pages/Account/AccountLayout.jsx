// src/pages/Account/AccountLayout.jsx
import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth
import './AccountLayout.css'; // CSS riêng

function AccountLayout() {
  const { logout } = useAuth(); // Lấy hàm logout từ context
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Chuyển về trang chủ sau khi logout
  };

  return (
    <Container className="my-4 my-md-5 account-layout"> {/* CSS */}
      <Row>
        {/* Cột Menu Account */}
        <Col md={4} lg={3} className="mb-4 mb-md-0">
          <Nav className="flex-column account-nav card p-3 shadow-sm"> {/* CSS */}
            <h5 className="account-nav-title mb-3">My Account</h5> {/* CSS */}
            <Nav.Link as={NavLink} to="/account" end className="account-nav-link"> {/* CSS */}
               <i className="bi bi-person me-2"></i> Profile
            </Nav.Link>
            <Nav.Link as={NavLink} to="/account/orders" className="account-nav-link"> {/* CSS */}
               <i className="bi bi-box-seam me-2"></i> Order History
            </Nav.Link>
            {/* <Nav.Link as={NavLink} to="/account/change-password" className="account-nav-link">
               <i className="bi bi-key me-2"></i> Change Password
            </Nav.Link> */}
             <Nav.Link onClick={handleLogout} className="account-nav-link text-danger mt-3"> {/* Nút Logout */}
               <i className="bi bi-box-arrow-right me-2"></i> Logout
            </Nav.Link>
          </Nav>
        </Col>

        {/* Cột Nội dung Trang con */}
        <Col md={8} lg={9}>
           {/* Render nội dung trang con (ProfilePage, OrderHistoryPage...) */}
           <Outlet />
        </Col>
      </Row>
    </Container>
  );
}

export default AccountLayout;