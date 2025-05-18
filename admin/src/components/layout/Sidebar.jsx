// admin-frontend/src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Nav, Collapse } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Sidebar() {
    const [openProducts, setOpenProducts] = useState(false);
    const [openMarketing, setOpenMarketing] = useState(false);
    const [openBlog, setOpenBlog] = useState(false); // State cho menu Blog

    const checkActive = (match, location, path) => {
        if (!location) return false;
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <Nav className="flex-column bg-dark vh-100 p-3 sidebar" id="sidebar">
            <Nav.Item className="mb-2 text-white">
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

            {/* Menu Products */}
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

            {/* === THÊM MENU BLOG === */}
            <Nav.Item>
                <Nav.Link
                    onClick={() => setOpenBlog(!openBlog)}
                    aria-controls="blog-collapse-menu"
                    aria-expanded={openBlog}
                    className="text-white d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                >
                    <span><i className="bi bi-pencil-square me-2"></i> Blog</span>
                    <i className={`bi bi-chevron-${openBlog ? 'down' : 'right'}`}></i>
                </Nav.Link>
                <Collapse in={openBlog}>
                    <div id="blog-collapse-menu" className="ms-3">
                        <NavLink to="/blog/posts" className={({ isActive, location }) => "nav-link text-white-50" + (checkActive(isActive, location, '/blog/posts') ? " active fw-bold text-white" : "")}>
                            All Posts
                        </NavLink>
                        <NavLink to="/blog/posts/new" className={({ isActive }) => "nav-link text-white-50" + (isActive ? " active fw-bold text-white" : "")}>
                            Add New Post
                        </NavLink>
                        <NavLink to="/blog/tags" className={({ isActive, location }) => "nav-link text-white-50" + (checkActive(isActive, location, '/blog/tags') ? " active fw-bold text-white" : "")}>
                            Tags
                        </NavLink>
                        <NavLink to="/blog/comments" className={({ isActive, location }) => "nav-link text-white-50" + (checkActive(isActive, location, '/blog/comments') ? " active fw-bold text-white" : "")}>
                            Comments
                        </NavLink>
                    </div>
                </Collapse>
            </Nav.Item>
            {/* === KẾT THÚC MENU BLOG === */}


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
        </Nav>
    );
}

export default Sidebar;
