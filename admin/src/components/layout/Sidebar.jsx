import React, { useState } from 'react';
import { NavLink } from 'react-router-dom'; // Dùng NavLink để active state
import { Nav, Collapse } from 'react-bootstrap'; // Sử dụng component của React Bootstrap nếu đã cài đặt, hoặc dùng class CSS thường
import 'bootstrap-icons/font/bootstrap-icons.css'; // Import CSS của Bootstrap Icons

function Sidebar() {
    // State để quản lý việc mở/đóng submenu (ví dụ cho Products)
    const [openProducts, setOpenProducts] = useState(false);
    const [openMarketing, setOpenMarketing] = useState(false);
    // Thêm state cho các menu khác nếu cần

    // Hàm kiểm tra active cho NavLink để bao gồm cả route con
    const checkActive = (match, location, path) => {
        if (!location) return false;
        // Active nếu path là chính xác hoặc là cha của location hiện tại
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <Nav className="flex-column bg-dark vh-100 p-3 sidebar" id="sidebar"> {/* Thêm id và class tùy chỉnh nếu cần */}
            <Nav.Item className="mb-2 text-white">
                {/* Có thể thêm logo hoặc tên cửa hàng ở đây */}
                <h4>Admin Panel</h4>
            </Nav.Item>
            <hr className="text-secondary" />

            <Nav.Item>
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => "nav-link text-white" + (isActive ? " active bg-secondary rounded" : "")}
                >
                    <i className="bi bi-speedometer2 me-2"></i> Dashboard
                </NavLink>
            </Nav.Item>

            {/* Menu Products với Submenu */}
            <Nav.Item>
                <Nav.Link
                    onClick={() => setOpenProducts(!openProducts)}
                    aria-controls="products-collapse-menu"
                    aria-expanded={openProducts}
                    className="text-white d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                >
                    <span><i className="bi bi-box-seam me-2"></i> Products</span>
                    <i className={`bi bi-chevron-${openProducts ? 'down' : 'right'}`}></i>
                </Nav.Link>
                <Collapse in={openProducts}>
                    <div id="products-collapse-menu" className="ms-3">
                        <NavLink to="/products" end className={({ isActive }) => "nav-link text-white-50" + (isActive ? " active fw-bold text-white" : "")} >
                            All Products
                        </NavLink>
                        <NavLink to="/products/new" className={({ isActive }) => "nav-link text-white-50" + (isActive ? " active fw-bold text-white" : "")}>
                            Add New
                        </NavLink>
                        <NavLink to="/categories" className={({ isActive }) => "nav-link text-white-50" + (isActive ? " active fw-bold text-white" : "")}>
                            Categories
                        </NavLink>
                        <NavLink to="/sizes" className={({ isActive }) => "nav-link text-white-50" + (isActive ? " active fw-bold text-white" : "")}>
                            Sizes
                        </NavLink>
                        <NavLink to="/colors" className={({ isActive }) => "nav-link text-white-50" + (isActive ? " active fw-bold text-white" : "")}>
                            Colors
                        </NavLink>
                        <NavLink to="/collections" className={({ isActive }) => "nav-link text-white-50" + (isActive ? " active fw-bold text-white" : "")}>
                            Collections
                        </NavLink>
                    </div>
                </Collapse>
            </Nav.Item>

            <Nav.Item>
                <NavLink
                    to="/orders"
                    className={({ isActive, location }) => "nav-link text-white" + (checkActive(isActive, location, '/orders') ? " active bg-secondary rounded" : "")}
                >
                    <i className="bi bi-cart-check me-2"></i> Orders
                </NavLink>
            </Nav.Item>

            <Nav.Item>
                <NavLink
                    to="/customers"
                    className={({ isActive, location }) => "nav-link text-white" + (checkActive(isActive, location, '/customers') ? " active bg-secondary rounded" : "")}
                >
                    <i className="bi bi-people me-2"></i> Customers
                </NavLink>
            </Nav.Item>

            {/* Menu Marketing với Submenu (Placeholder) */}
            <Nav.Item>
                <Nav.Link
                    onClick={() => setOpenMarketing(!openMarketing)}
                    aria-controls="marketing-collapse-menu"
                    aria-expanded={openMarketing}
                    className="text-white d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                >
                    <span><i className="bi bi-megaphone me-2"></i> Marketing</span>
                    <i className={`bi bi-chevron-${openMarketing ? 'down' : 'right'}`}></i>
                </Nav.Link>
                <Collapse in={openMarketing}>
                    <div id="marketing-collapse-menu" className="ms-3">
                        <NavLink to="/marketing/notifications" className={({ isActive }) => "nav-link text-white-50" + (isActive ? " active fw-bold text-white" : "")}>
                            Notifications
                        </NavLink>
                        <NavLink to="/marketing/emails" className={({ isActive }) => "nav-link text-white-50" + (isActive ? " active fw-bold text-white" : "")}>
                            Emails
                        </NavLink>
                    </div>
                </Collapse>
            </Nav.Item>
            {/* Thêm các mục menu khác ở đây (Settings, etc.) */}
        </Nav>
    );
}

export default Sidebar;