// src/components/layout/Footer.jsx
import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Footer.css'; // File CSS riêng

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer bg-dark text-light mt-auto"> {/* CSS: Style màu nền, chữ */}
      <Container className="py-4 py-md-5">
        <Row>
          {/* Cột 1: Logo/Giới thiệu ngắn */}
          <Col lg={4} md={6} className="mb-4 mb-lg-0">
            <h5 className="footer-brand logo-text mb-3">NOIZEE</h5> {/* CSS: Dùng lại style logo */}
            <p className="footer-text text-muted"> {/* CSS: Dùng Roboto Mono? */}
              Streetwear brand for the bold and the restless. Express your noise.
            </p>
             {/* Social Media Icons */}
             <Nav className="social-icons"> {/* CSS: Style icons */}
                <Nav.Link href="https://instagram.com/YOUR_INSTAGRAM" target="_blank" rel="noopener noreferrer" className="text-light"><i className="bi bi-instagram"></i></Nav.Link>
                <Nav.Link href="https://facebook.com/YOUR_FACEBOOK" target="_blank" rel="noopener noreferrer" className="text-light"><i className="bi bi-facebook"></i></Nav.Link>
                <Nav.Link href="https://tiktok.com/YOUR_TIKTOK" target="_blank" rel="noopener noreferrer" className="text-light"><i className="bi bi-tiktok"></i></Nav.Link>
             </Nav>
          </Col>

          {/* Cột 2: Quick Links */}
          <Col lg={2} md={6} className="mb-4 mb-lg-0">
            <h6 className="footer-heading">Shop</h6> {/* CSS: Font Oswald? */}
            <Nav className="flex-column footer-links">
              <Nav.Link as={Link} to="/collections" className="text-light">Collections</Nav.Link>
              <Nav.Link as={Link} to="/" className="text-light">New Arrivals</Nav.Link>
              <Nav.Link as={Link} to="/accessories" className="text-light">Accessories</Nav.Link>
            </Nav>
          </Col>

          {/* Cột 3: Customer Service */}
          <Col lg={3} md={6} className="mb-4 mb-lg-0">
            <h6 className="footer-heading">Customer Care</h6> {/* CSS: Font Oswald? */}
            <Nav className="flex-column footer-links">
              <Nav.Link href="#contact" className="text-light">Contact Us</Nav.Link> {/* TODO: Link to contact */}
              <Nav.Link href="#shipping" className="text-light">Shipping & Returns</Nav.Link> {/* TODO: Link to policy */}
              <Nav.Link href="#faq" className="text-light">FAQ</Nav.Link> {/* TODO: Link to FAQ */}
            </Nav>
          </Col>

           {/* Cột 4: Newsletter/About */}
           <Col lg={3} md={6} className="mb-4 mb-lg-0">
            <h6 className="footer-heading">About Noizee</h6> {/* CSS: Font Oswald? */}
            <Nav className="flex-column footer-links">
                 <Nav.Link as={Link} to="/the-noizee" className="text-light">Our Story</Nav.Link>
                {/* Thêm form Newsletter nếu muốn */}
            </Nav>
          </Col>

        </Row>
      </Container>
       <div className="footer-bottom text-center py-3"> {/* CSS: Style phần bottom */}
         <small className="text-muted">&copy; {currentYear} NOIZEE. All Rights Reserved.</small>
       </div>
    </footer>
  );
}

export default Footer;