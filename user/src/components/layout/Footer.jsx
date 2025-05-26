import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaTiktok } from 'react-icons/fa'; // Hoặc FiFacebook, etc.
import { APP_NAME } from '../../utils/constants'; // Import APP_NAME

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

  return (
    <footer className="bg-gray-100 text-gray-700 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Top Section: Links and Newsletter (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.titleKey}>
              <h5 className="text-lg font-semibold text-gray-800 mb-4">{t(section.titleKey)}</h5>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.textKey}>
                    <Link to={link.path} className="hover:text-indigo-600 transition-colors duration-200 text-sm">
                      {t(link.textKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter/Contact Section (Optional) */}
          <div>
            <h5 className="text-lg font-semibold text-gray-800 mb-4">{t('footer.stayConnected.title')}</h5>
            <p className="text-sm mb-3">{t('footer.stayConnected.subscribePrompt')}</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder={t('footer.stayConnected.emailPlaceholder')}
                className="w-full sm:flex-grow px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                aria-label={t('footer.stayConnected.emailPlaceholder')}
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 text-sm rounded-md hover:bg-indigo-700 transition-colors duration-200"
              >
                {t('footer.stayConnected.subscribeButton')}
              </button>
            </form>
            {/* Social Media Links */}
            <div className="mt-6">
              <h6 className="text-md font-semibold text-gray-800 mb-3">{t('footer.followUs')}</h6>
              <div className="flex space-x-4">
                {socialLinks.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-gray-500 hover:text-indigo-600 transition-colors duration-200"
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Copyright and Payment Methods (Optional) */}
        <div className="border-t border-gray-300 pt-8 text-center md:flex md:justify-between md:items-center">
          <p className="text-sm mb-4 md:mb-0">
            &copy; {currentYear} {t('appName', APP_NAME)}. {t('footer.allRightsReserved')}.
          </p>
          {/* Payment methods (optional) */}
          {/* <div className="flex justify-center space-x-2">
            <img src="/path/to/visa.png" alt="Visa" className="h-6" />
            <img src="/path/to/mastercard.png" alt="Mastercard" className="h-6" />
            <img src="/path/to/paypal.png" alt="Paypal" className="h-6" />
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;