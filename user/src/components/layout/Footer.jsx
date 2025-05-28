// src/components/layout/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaTiktok } from 'react-icons/fa';
import { APP_NAME } from '../../utils/constants'; // Import APP_NAME
import { classNames } from '../../utils/helpers'; // classNames vẫn có thể hữu ích

// Nếu bạn có logo dạng ảnh cho footer
// import footerLogo from '../../assets/images/footer-logo.png'; // Ví dụ đường dẫn

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      titleKey: 'footer.customerService.title',
      links: [
        { textKey: 'footer.customerService.contactUs', path: '/contact' },
        { textKey: 'footer.customerService.faq', path: '/faq' },
        { textKey: 'footer.customerService.shippingInfo', path: '/shipping-info' },
        { textKey: 'footer.customerService.returnsExchanges', path: '/returns-exchanges' },
        { textKey: 'footer.customerService.trackOrder', path: '/track-order' },
      ],
    },
    {
      titleKey: 'footer.aboutUs.title',
      links: [
        { textKey: 'footer.aboutUs.ourStory', path: '/about' },
        { textKey: 'footer.aboutUs.careers', path: '/careers' },
        { textKey: 'footer.aboutUs.press', path: '/press' },
        { textKey: 'footer.aboutUs.sustainability', path: '/sustainability' },
      ],
    },
    {
      titleKey: 'footer.legal.title',
      links: [
        { textKey: 'footer.legal.termsConditions', path: '/terms-conditions' },
        { textKey: 'footer.legal.privacyPolicy', path: '/privacy-policy' },
        { textKey: 'footer.legal.cookiePolicy', path: '/cookie-policy' },
      ],
    },
  ];

  const socialLinks = [
    { Icon: FaFacebookF, href: 'https://facebook.com/yourpage', label: 'Facebook' },
    { Icon: FaInstagram, href: 'https://instagram.com/yourpage', label: 'Instagram' },
    { Icon: FaTwitter, href: 'https://twitter.com/yourpage', label: 'Twitter' },
    { Icon: FaYoutube, href: 'https://youtube.com/yourchannel', label: 'YouTube' },
    { Icon: FaTiktok, href: 'https://tiktok.com/@yourprofile', label: 'TikTok' },
  ];

  // Class cho link footer, sử dụng text-muted của Bootstrap và hiệu ứng hover tùy chỉnh nếu cần
  const footerLinkClass = "text-decoration-none text-muted hover-text-primary small";
  // Class cho tiêu đề section footer, fs-5 (font-size) và fw-semibold (font-weight)
  // Font family sẽ được kế thừa từ h5 (Oswald) nếu bạn đã định nghĩa trong index.css
  const footerSectionTitleClass = "fs-5 fw-semibold text-body mb-3"; // mb-3 thay cho mb-4

  return (
    // bg-light (tương tự bg-gray-100), text-dark (màu chữ chính) hoặc text-muted
    // pt-5, pb-4 (padding top/bottom của Bootstrap, tương đương pt-16, pb-8 Tailwind tùy theo scale)
    <footer className="bg-light text-dark pt-5 pb-4 main-footer"> {/* Thêm class main-footer để nhận font Roboto Mono nếu cần */}
      <div className="container px-4"> {/* container và padding ngang của Bootstrap */}
        {/* row và g-md-4 (gap cho medium screen trở lên) */}
        <div className="row g-4 mb-5"> {/* mb-5 tương đương mb-12 */}
          {/* Footer Sections */}
          {footerSections.map((section) => (
            // col-12 (mặc định), col-md-6 (2 cột trên medium), col-lg-3 (4 cột trên large)
            <div key={section.titleKey} className="col-12 col-md-6 col-lg-3">
              <h5 className={footerSectionTitleClass}>{t(section.titleKey)}</h5>
              {/* list-unstyled để loại bỏ bullet points và padding mặc định của ul */}
              <ul className="list-unstyled">
                {section.links.map((link) => (
                  // mb-1 hoặc mb-2 cho khoảng cách giữa các link (thay cho space-y-2)
                  <li key={link.textKey} className="mb-2">
                    <Link to={link.path} className={footerLinkClass}>
                      {t(link.textKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter/Contact Section */}
          <div className="col-12 col-md-6 col-lg-3">
            <h5 className={footerSectionTitleClass}>{t('footer.stayConnected.title')}</h5>
            {/* small class cho text nhỏ hơn (thay cho text-sm) */}
            <p className="small mb-3 footer-text"> {/* Thêm footer-text để nhận font Cormorant Garamond nếu cần */}
              {t('footer.stayConnected.subscribePrompt')}
            </p>
            {/* input-group của Bootstrap cho form inline */}
            <form onSubmit={(e) => e.preventDefault()} className="input-group mb-3">
              <input
                type="email"
                placeholder={t('footer.stayConnected.emailPlaceholder')}
                // form-control và form-control-sm (kích thước nhỏ)
                className="form-control form-control-sm"
                aria-label={t('footer.stayConnected.emailPlaceholder')}
              />
              {/* btn, btn-primary, btn-sm */}
              <button
                type="submit"
                className="btn btn-primary btn-sm"
              >
                {t('footer.stayConnected.subscribeButton')}
              </button>
            </form>
            {/* Social Media Links */}
            <div className="mt-4">
              {/* text-body (màu chữ mặc định), mb-3 */}
              <h6 className="fw-semibold text-body mb-3">{t('footer.followUs')}</h6>
              {/* d-flex và gap-3 (khoảng cách giữa các icon) */}
              <div className="d-flex gap-3">
                {socialLinks.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    // text-muted và hiệu ứng hover tùy chỉnh
                    className="text-muted hover-text-primary"
                  >
                    <Icon size={20} /> {/* Kích thước icon giữ nguyên */}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Copyright */}
        {/* border-top, pt-4 (padding top) */}
        {/* text-center, d-md-flex, justify-content-md-between, align-items-md-center cho layout responsive */}
        <div className="border-top pt-4 text-center d-md-flex justify-content-md-between align-items-md-center">
          {/* small class, mb-3 cho mobile, mb-md-0 cho desktop */}
          <p className="small mb-3 mb-md-0 footer-text"> {/* Thêm footer-text */}
            © {currentYear} {t('appName', APP_NAME)}. {t('footer.allRightsReserved')}.
          </p>
          {/* Payment methods (optional) */}
          {/* <div className="d-flex justify-content-center gap-2">
            <img src="/path/to/visa.png" alt="Visa" style={{ height: '24px' }} />
            <img src="/path/to/mastercard.png" alt="Mastercard" style={{ height: '24px' }} />
            <img src="/path/to/paypal.png" alt="Paypal" style={{ height: '24px' }} />
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;