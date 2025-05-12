// src/components/layout/Footer.jsx
import React from 'react';
import { Container, Row, Col, Nav, Form, Button } from 'react-bootstrap'; // Thêm Form, Button
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = (e) => {
      e.preventDefault();
      // TODO: Xử lý logic đăng ký nhận tin
      alert("Newsletter subscription submitted (demo)!");
  };

  return (
    <footer className="main-footer bg-dark text-light mt-auto">
      <Container className="py-4 py-md-5 footer-content">
        <Row>
          {/* Cột 1: Logo/Giới thiệu & Social */}
          <Col lg={3} md={6} className="mb-4 mb-lg-0 footer-col">
            <Link to="/" className="footer-brand logo-text mb-3 d-inline-block text-decoration-none">NOIZEE</Link>
            <p className="footer-text text-white-50">
              Streetwear for the unapologetically loud. Express your inner noise.
            </p>
            <Nav className="social-icons mt-3">
              <Nav.Link href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="text-white-50 me-2" aria-label="Instagram"><i className="bi bi-instagram"></i></Nav.Link>
              <Nav.Link href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className="text-white-50 me-2" aria-label="Facebook"><i className="bi bi-facebook"></i></Nav.Link>
              <Nav.Link href="https://tiktok.com/" target="_blank" rel="noopener noreferrer" className="text-white-50" aria-label="TikTok"><i className="bi bi-tiktok"></i></Nav.Link>
            </Nav>
          </Col>

          {/* Cột 2: Shop Links */}
          <Col lg={2} md={3} sm={6} xs={6} className="mb-4 mb-lg-0 footer-col">
            <h6 className="footer-heading">Shop</h6>
            <Nav className="flex-column footer-links">
              <Nav.Link as={Link} to="/collections">All Collections</Nav.Link>
              <Nav.Link as={Link} to="/">New Arrivals</Nav.Link>
              <Nav.Link as={Link} to="/accessories">Accessories</Nav.Link>
              <Nav.Link as={Link} to="/collections?filter=sale">Sale</Nav.Link> {/* Ví dụ link sale */}
            </Nav>
          </Col>

          {/* Cột 3: Customer Care */}
          <Col lg={2} md={3} sm={6} xs={6} className="mb-4 mb-lg-0 footer-col">
            <h6 className="footer-heading">Support</h6>
            <Nav className="flex-column footer-links">
              <Nav.Link as={Link} to="/contact">Contact Us</Nav.Link>
              <Nav.Link as={Link} to="/shipping-returns">Shipping & Returns</Nav.Link>
              <Nav.Link as={Link} to="/faq">FAQ</Nav.Link>
              <Nav.Link as={Link} to="/size-guide">Size Guide</Nav.Link>
            </Nav>
          </Col>

          {/* Cột 4: About & Newsletter */}
          <Col lg={2} md={6} className="mb-4 mb-lg-0 footer-col d-none d-md-block"> {/* Ẩn cột này trên mobile nếu cần */}
            <h6 className="footer-heading">Company</h6>
            <Nav className="flex-column footer-links">
              <Nav.Link as={Link} to="/the-noizee">Our Story</Nav.Link>
              <Nav.Link as={Link} to="/careers">Careers</Nav.Link>
              <Nav.Link as={Link} to="/terms-conditions">Terms</Nav.Link>
              <Nav.Link as={Link} to="/privacy-policy">Privacy</Nav.Link>
            </Nav>
          </Col>

          {/* Cột 5: Newsletter (Có thể đặt ở đây hoặc vị trí khác) */}
           <Col lg={3} md={6} className="mb-4 mb-lg-0 footer-col">
            <h6 className="footer-heading">Join The Noise</h6>
            <p className="footer-text text-white-50 small">Get early access to new drops, exclusive deals, and more.</p>
            <Form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <Form.Group controlId="footerNewsletterEmail" className="mb-2">
                <Form.Control type="email" placeholder="Enter your email" className="form-control-sm newsletter-input" required />
              </Form.Group>
              <Button variant="outline-light" type="submit" size="sm" className="w-100 newsletter-button">
                Subscribe
              </Button>
            </Form>
          </Col>

        </Row>
      </Container>
      <div className="footer-bottom text-center py-3">
        <small className="text-white-50">&copy; {currentYear} NOIZEE. All Rights Reserved. Crafted with noise.</small>
      </div>
    </footer>
  );
}

export default Footer;