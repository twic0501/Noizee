// src/components/layout/Footer.jsx
import React from 'react';
import { Container, Row, Col, Nav, Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './Footer.css';

function Footer() {
  const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
  const currentYear = new Date().getFullYear();
  const currentLang = i18n.language; // Lấy ngôn ngữ hiện tại

  const handleNewsletterSubmit = (e) => {
      e.preventDefault();
      // TODO: Xử lý logic đăng ký nhận tin
      alert(t('footer.newsletterSubmitAlert')); // Sử dụng key dịch cho alert
  };

  // Helper để tạo link với prefix ngôn ngữ
  const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');


  return (
    <footer className="main-footer bg-dark text-light mt-auto">
      <Container className="py-4 py-md-5 footer-content">
        <Row>
          {/* Cột 1: Logo/Giới thiệu & Social */}
          <Col lg={3} md={6} className="mb-4 mb-lg-0 footer-col">
            {/* Logo không cần dịch, nhưng link cần prefix ngôn ngữ */}
            <Link to={langLink("/")} className="footer-brand logo-text mb-3 d-inline-block text-decoration-none">NOIZEE</Link>
            <p className="footer-text text-white-50">
              {t('footer.brandDescription')}
            </p>
            <Nav className="social-icons mt-3">
              <Nav.Link href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="text-white-50 me-2" aria-label="Instagram"><i className="bi bi-instagram"></i></Nav.Link>
              <Nav.Link href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className="text-white-50 me-2" aria-label="Facebook"><i className="bi bi-facebook"></i></Nav.Link>
              <Nav.Link href="https://tiktok.com/" target="_blank" rel="noopener noreferrer" className="text-white-50" aria-label="TikTok"><i className="bi bi-tiktok"></i></Nav.Link>
            </Nav>
          </Col>

          {/* Cột 2: Shop Links */}
          <Col lg={2} md={3} sm={6} xs={6} className="mb-4 mb-lg-0 footer-col">
            <h6 className="footer-heading">{t('footer.shop')}</h6>
            <Nav className="flex-column footer-links">
              <Nav.Link as={Link} to={langLink("/collections")}>{t('footer.allCollections')}</Nav.Link>
              <Nav.Link as={Link} to={langLink("/")}>{t('footer.newArrivalsLink')}</Nav.Link>
              <Nav.Link as={Link} to={langLink("/accessories")}>{t('footer.accessoriesLink')}</Nav.Link>
              <Nav.Link as={Link} to={langLink("/collections?filter=sale")}>{t('footer.saleLink')}</Nav.Link>
            </Nav>
          </Col>

          {/* Cột 3: Customer Care */}
          <Col lg={2} md={3} sm={6} xs={6} className="mb-4 mb-lg-0 footer-col">
            <h6 className="footer-heading">{t('footer.support')}</h6>
            <Nav className="flex-column footer-links">
              <Nav.Link as={Link} to={langLink("/contact")}>{t('footer.contactUs')}</Nav.Link>
              <Nav.Link as={Link} to={langLink("/shipping-returns")}>{t('footer.shippingReturns')}</Nav.Link>
              <Nav.Link as={Link} to={langLink("/faq")}>{t('footer.faq')}</Nav.Link>
              <Nav.Link as={Link} to={langLink("/size-guide")}>{t('footer.sizeGuide')}</Nav.Link>
            </Nav>
          </Col>

          {/* Cột 4: About & Newsletter */}
          <Col lg={2} md={6} className="mb-4 mb-lg-0 footer-col d-none d-md-block">
            <h6 className="footer-heading">{t('footer.company')}</h6>
            <Nav className="flex-column footer-links">
              <Nav.Link as={Link} to={langLink("/the-noizee")}>{t('footer.ourStory')}</Nav.Link>
              <Nav.Link as={Link} to={langLink("/careers")}>{t('footer.careers')}</Nav.Link>
              <Nav.Link as={Link} to={langLink("/terms-conditions")}>{t('footer.terms')}</Nav.Link>
              <Nav.Link as={Link} to={langLink("/privacy-policy")}>{t('footer.privacy')}</Nav.Link>
            </Nav>
          </Col>

           <Col lg={3} md={6} className="mb-4 mb-lg-0 footer-col">
            <h6 className="footer-heading">{t('footer.joinTheNoise')}</h6>
            <p className="footer-text text-white-50 small">{t('footer.newsletterPrompt')}</p>
            <Form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <Form.Group controlId="footerNewsletterEmail" className="mb-2">
                <Form.Control 
                    type="email" 
                    placeholder={t('footer.newsletterPlaceholder')} 
                    className="form-control-sm newsletter-input" 
                    required 
                />
              </Form.Group>
              <Button variant="outline-light" type="submit" size="sm" className="w-100 newsletter-button">
                {t('footer.subscribe')}
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
      <div className="footer-bottom text-center py-3">
        {/* Sử dụng t function với options cho biến */}
        <small className="text-white-50">{t('footer.copyright', { year: currentYear })}</small>
      </div>
    </footer>
  );
}

export default Footer;