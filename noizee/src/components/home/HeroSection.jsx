import React from 'react';
// import { Link } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';

const HeroSection = () => {
    // const { t } = useTranslation();
    // Logic và JSX cho hero section từ code mẫu của bạn
    return (
        <div className="hero-section" style={{ /* background image sẽ được thêm từ CSS hoặc props */ }}>
            <div>
                <h1>{/*t('hero.title')*/}NOIZEE AW25 (Placeholder)</h1>
                <p>{/*t('hero.subtitle')*/}Discover the new collection.</p>
                {/* <Link to="/collections" className="btn btn-outline-light btn-lg">{t('hero.button')}</Link> */}
            </div>
        </div>
    );
};
export default HeroSection;