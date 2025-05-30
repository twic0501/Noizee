import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react'; // Ví dụ icons mạng xã hội

const Footer = () => {
    const { t } = useTranslation();

    const currentYear = new Date().getFullYear();

    // TODO: Lấy các link social media từ cấu hình hoặc .env
    const socialLinks = [
        // { name: 'Facebook', icon: <Facebook size={20} />, url: '#' },
        // { name: 'Instagram', icon: <Instagram size={20} />, url: '#' },
        // { name: 'Twitter', icon: <Twitter size={20} />, url: '#' },
    ];

    const footerNavLinks = [
        { labelKey: 'footer.contactUs', path: '/contact' },
        { labelKey: 'footer.shippingInfo', path: '/shipping' },
        { labelKey: 'footer.returnsExchanges', path: '/returns' },
        { labelKey: 'footer.faq', path: '/faq' },
        { labelKey: 'footer.terms', path: '/terms-of-service' },
        { labelKey: 'footer.privacy', path: '/privacy-policy' },
    ];

    return (
        <footer className="bg-body-tertiary text-center text-lg-start text-muted border-top mt-auto"> {/* mt-auto để đẩy footer xuống cuối */}
            {/* Section: Social media - Tùy chọn */}
            {socialLinks.length > 0 && (
                <section className="d-flex justify-content-center justify-content-lg-between p-4 border-bottom">
                    <div className="me-5 d-none d-lg-block">
                        <span>{t('footer.connectWithUs', 'Get connected with us on social networks:')}</span>
                    </div>
                    <div>
                        {socialLinks.map(social => (
                            <a key={social.name} href={social.url} className="me-4 text-reset" aria-label={social.name} target="_blank" rel="noopener noreferrer">
                                {social.icon || social.name}
                            </a>
                        ))}
                    </div>
                </section>
            )}

            {/* Section: Links */}
            <section className="">
                <div className="container text-center text-md-start mt-5">
                    <div className="row mt-3">
                        {/* Column 1: Company Info/Logo */}
                        <div className="col-md-3 col-lg-4 col-xl-3 mx-auto mb-4">
                            <h6 className="text-uppercase fw-bold mb-4" /* style={{ fontFamily: LOGO_FONT_FAMILY }} */>
                                {/* <MapPin size={18} className="me-1" />  // Ví dụ icon logo */}
                                {t('siteName', 'Noizee')}
                            </h6>
                            <p className="small">
                                {t('footer.companyDescription', 'High-quality streetwear and urban fashion. Discover unique designs and express your style.')}
                            </p>
                        </div>

                        {/* Column 2: Products/Categories (Tùy chọn) */}
                        <div className="col-md-2 col-lg-2 col-xl-2 mx-auto mb-4">
                            <h6 className="text-uppercase fw-bold mb-4 small">
                                {t('footer.categories', 'Categories')}
                            </h6>
                            <ul className="list-unstyled small">
                                {/* TODO: Lấy danh sách category động hoặc hardcode các link chính */}
                                <li><Link to="/collections/category/outerwear" className="text-reset">{t('footer.outerwear', 'Outerwear')}</Link></li>
                                <li><Link to="/collections/category/t-shirts" className="text-reset">{t('footer.tshirts', 'T-Shirts')}</Link></li>
                                <li><Link to="/collections/category/pants" className="text-reset">{t('footer.pants', 'Pants')}</Link></li>
                                <li><Link to="/collections" className="text-reset">{t('footer.allCollections', 'All Collections')}</Link></li>
                            </ul>
                        </div>

                        {/* Column 3: Useful links */}
                        <div className="col-md-3 col-lg-2 col-xl-2 mx-auto mb-4">
                            <h6 className="text-uppercase fw-bold mb-4 small">
                                {t('footer.usefulLinks', 'Useful links')}
                            </h6>
                            <ul className="list-unstyled small">
                                {footerNavLinks.slice(0, Math.ceil(footerNavLinks.length / 2)).map(link => ( // Chia thành 2 cột nhỏ
                                    <li key={link.path}><Link to={link.path} className="text-reset">{t(link.labelKey)}</Link></li>
                                ))}
                            </ul>
                        </div>
                         <div className="col-md-3 col-lg-2 col-xl-2 mx-auto mb-4 d-none d-lg-block"> {/* Ẩn cột này trên mobile nếu quá chật */}
                             <h6 className="text-uppercase fw-bold mb-4 small visually-hidden">
                                {t('footer.usefulLinks', 'Useful links')} {/* Để giữ cấu trúc, ẩn tiêu đề */}
                            </h6>
                            <ul className="list-unstyled small" style={{marginTop: '2.25rem'}}> {/* Căn chỉnh với cột bên trái */}
                                {footerNavLinks.slice(Math.ceil(footerNavLinks.length / 2)).map(link => (
                                    <li key={link.path}><Link to={link.path} className="text-reset">{t(link.labelKey)}</Link></li>
                                ))}
                            </ul>
                        </div>


                        {/* Column 4: Contact (Tùy chọn) */}
                        {/*
                        <div className="col-md-4 col-lg-3 col-xl-3 mx-auto mb-md-0 mb-4">
                            <h6 className="text-uppercase fw-bold mb-4 small">{t('footer.contact', 'Contact')}</h6>
                            <p className="small"><i className="fas fa-home me-3"></i> New York, NY 10012, US</p>
                            <p className="small"><i className="fas fa-envelope me-3"></i> info@example.com</p>
                            <p className="small"><i className="fas fa-phone me-3"></i> + 01 234 567 88</p>
                        </div>
                        */}
                    </div>
                </div>
            </section>

            {/* Copyright */}
            <div className="text-center p-4 small" style={{ backgroundColor: 'rgba(0, 0, 0, 0.025)' }}>
                © {currentYear} {t('footer.copyright', 'Copyright:')}
                <a className="text-reset fw-bold ms-1" href="https://noizee.com/">{t('siteName', 'Noizee')}.com</a>.
                {t('footer.rightsReserved', ' All rights reserved.')}
            </div>
        </footer>
    );
};

export default React.memo(Footer);