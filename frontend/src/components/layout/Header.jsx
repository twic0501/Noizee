// src/components/layout/Header.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Offcanvas } from 'react-bootstrap'; // Thêm Offcanvas
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { useAuth } from '../../hooks/useAuth'; // Để kiểm tra đăng nhập
import { useCart } from '../../hooks/useCart';   // Để lấy số lượng item trong giỏ
import './Header.css';

const Logo = () => (
    <Link to="/" className="navbar-brand logo-text" aria-label="Noizee Homepage">
        NOIZEE
    </Link>
);

function Header() {
    const location = useLocation();
    const { isAuthenticated, userInfo } = useAuth(); // Lấy trạng thái đăng nhập
    const { totalItems: cartItemCount } = useCart(); // Lấy số lượng item trong giỏ

    const isScrolled = useScrollPosition(50);
    const isHomePage = location.pathname === '/';

    const [headerBackground, setHeaderBackground] = useState(isHomePage && !isScrolled ? 'header-transparent' : 'header-white');
    const [showMenuText, setShowMenuText] = useState(isHomePage && !isScrolled ? false : true);
    const [showOffcanvas, setShowOffcanvas] = useState(false); // State cho Offcanvas menu mobile

    const handleCloseOffcanvas = () => setShowOffcanvas(false);
    const handleShowOffcanvas = () => setShowOffcanvas(true);

    useEffect(() => {
        if (isHomePage) {
            setHeaderBackground(isScrolled ? 'header-white' : 'header-transparent');
            setShowMenuText(isScrolled);
        } else {
            setHeaderBackground('header-white');
            setShowMenuText(true);
        }
    }, [isScrolled, isHomePage, location.pathname]); // Thêm location.pathname để cập nhật khi chuyển trang

    const menuItems = [
        { path: "/", name: "New arrivals", exact: true },
        { path: "/collections", name: "Collections" },
        { path: "/accessories", name: "Accessories" },
        { path: "/the-noizee", name: "The Noizee" },
    ];

    const navLinkClass = ({ isActive }) =>
        `nav-link main-menu-link ${isActive ? 'active' : ''} ${!showMenuText && isHomePage ? 'text-transparent-strict' : ''}`;


    return (
        <>
            <Navbar
                expand="lg"
                fixed="top"
                className={`main-header ${headerBackground} ${showMenuText || !isHomePage ? 'menu-text-visible' : 'menu-text-hidden'}`}
                variant={headerBackground === 'header-white' || showOffcanvas ? 'light' : 'dark'} // Đảm bảo variant đúng cho Offcanvas
            >
                <Container fluid className="header-container px-md-3 px-lg-5">
                    <Logo />
                    <Navbar.Toggle aria-controls="main-navbar-nav" onClick={handleShowOffcanvas} className="ms-auto me-2 d-lg-none custom-toggler"/>
                    <Nav className={`mx-auto main-menu d-none d-lg-flex ${!showMenuText && isHomePage ? 'invisible-on-hero' : ''}`}>
                        {menuItems.map(item => (
                            <NavLink key={item.path} to={item.path} className={navLinkClass} end={item.exact}>
                                {item.name}
                            </NavLink>
                        ))}
                    </Nav>
                    <Nav className="header-icons d-none d-lg-flex align-items-center">
                        <Nav.Link href="#search" title="Search" className="header-icon-link p-0">
                            <i className="bi bi-search"></i>
                        </Nav.Link>
                        <Nav.Link as={Link} to={isAuthenticated ? "/account" : "/login"} title={isAuthenticated ? (userInfo?.customer_name || "Tài khoản") : "Đăng nhập"} className="header-icon-link p-0">
                            <i className="bi bi-person"></i>
                        </Nav.Link>
                        <Nav.Link as={Link} to="/cart" title="Giỏ hàng" className="header-icon-link p-0 position-relative">
                            <i className="bi bi-bag"></i>
                            {cartItemCount > 0 && (
                                <Badge pill bg="danger" className="cart-count-badge">
                                    {cartItemCount}
                                </Badge>
                            )}
                        </Nav.Link>
                    </Nav>
                </Container>
            </Navbar>

            {/* Offcanvas Menu for Mobile */}
            <Offcanvas show={showOffcanvas} onHide={handleCloseOffcanvas} placement="end" className="mobile-offcanvas">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title><Logo /></Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="d-flex flex-column">
                    <Nav className="flex-column mobile-main-menu mb-auto">
                        {menuItems.map(item => (
                            <NavLink key={`mobile-${item.path}`} to={item.path} className="nav-link mobile-menu-link" onClick={handleCloseOffcanvas} end={item.exact}>
                                {item.name}
                            </NavLink>
                        ))}
                    </Nav>
                    <Nav className="flex-column mobile-icon-menu mt-3">
                         <Nav.Link as={Link} to={isAuthenticated ? "/account" : "/login"} className="nav-link mobile-icon-link" onClick={handleCloseOffcanvas}>
                            <i className="bi bi-person me-2"></i>{isAuthenticated ? (userInfo?.customer_name || "Tài khoản") : "Đăng nhập / Đăng ký"}
                        </Nav.Link>
                        <Nav.Link as={Link} to="/cart" className="nav-link mobile-icon-link" onClick={handleCloseOffcanvas}>
                            <i className="bi bi-bag me-2"></i>Giỏ hàng {cartItemCount > 0 && `(${cartItemCount})`}
                        </Nav.Link>
                        <Nav.Link href="#search" className="nav-link mobile-icon-link" onClick={handleCloseOffcanvas}>
                            <i className="bi bi-search me-2"></i>Tìm kiếm
                        </Nav.Link>
                    </Nav>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}

export default Header;