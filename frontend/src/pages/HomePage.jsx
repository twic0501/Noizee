// src/pages/HomePage.jsx
import React from 'react';
import { Container, Button } from 'react-bootstrap'; // Row, Col không dùng trực tiếp ở đây nữa
import { Link, useParams } from 'react-router-dom'; // Thêm useParams
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS_QUERY } from '../api/graphql/queries/productQueries';
import ProductGrid from '../components/product/ProductGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import ImageCarousel from '../components/product/ImageCarousel';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './HomePage.css';

// Hero Section
const HeroSection = () => {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const currentLang = params.lang || i18n.language || 'vi';
  const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');

  return (
    <div className="hero-section text-center">
      <Container>
        <h1 className="hero-title">{t('homePage.hero.title')}</h1>
        <p className="hero-subtitle lead">
          {t('homePage.hero.subtitle')}
        </p>
        <Button as={Link} to={langLink("/collections")} variant="outline-light" size="lg" className="hero-cta-button mt-3">
          {t('homePage.hero.ctaButton')}
        </Button>
      </Container>
    </div>
  );
};

// New Products Section
const NewProductSection = () => {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const currentLang = params.lang || i18n.language || 'vi';
  const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');

  const { loading, error, data } = useQuery(GET_PRODUCTS_QUERY, {
    variables: {
      filter: { is_new_arrival: true }, // Sửa isNewArrival thành is_new_arrival nếu schema backend là vậy
      limit: 4,
      offset: 0,
      // lang: i18n.language // Truyền ngôn ngữ nếu query của bạn hỗ trợ
    },
    fetchPolicy: 'cache-and-network',
  });

  // ProductCard sẽ tự xử lý việc hiển thị tên sản phẩm theo ngôn ngữ
  const newProducts = data?.products?.products || [];

  return (
    <Container className="text-center my-5 py-4 new-arrivals-section">
      <h2 className="section-title mb-3">{t('homePage.newArrivals.title')}</h2>
      <p className="section-subtitle lead text-muted mx-auto mb-5">
        {t('homePage.newArrivals.subtitle')}
      </p>
      {loading && <LoadingSpinner message={t('loadingSpinner.loading')} />}
      {error && <AlertMessage variant="warning">{t('homePage.newArrivals.loadError')}</AlertMessage>}
      {!loading && !error && newProducts.length > 0 && (
        <ProductGrid products={newProducts} itemsPerRow={{ xs: 1, sm: 2, md: 4, lg: 4 }} />
      )}
      {!loading && !error && newProducts.length === 0 && (
        <p className="text-muted">{t('homePage.newArrivals.noProducts')}</p>
      )}
      <Button as={Link} to={langLink("/collections?filter=new")} variant="dark" size="lg" className="mt-5 view-all-btn">
        {t('homePage.newArrivals.viewAllButton')}
      </Button>
    </Container>
  );
};

// Featured Carousel Section
const FeaturedCarouselSection = () => {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const currentLang = params.lang || i18n.language || 'vi';
  const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');

    // Dữ liệu slide này nên được quản lý từ CMS hoặc backend và có cấu trúc đa ngôn ngữ
    // Ví dụ:
    // {
    //   id: 'slide1',
    //   src: '/images/featured/look1.jpg',
    //   altKey: 'homePage.carousel.slide1.alt', // Key cho alt text
    //   captionTitleKey: 'homePage.carousel.slide1.title',
    //   captionTextKey: 'homePage.carousel.slide1.text',
    //   linkTo: '/collections/summer-noize-25',
    //   buttonTextKey: 'homePage.carousel.slide1.button'
    // }
    const featuredSlidesData = [
        {
            id: 'summer25',
            src: '',
            altKey: 'homePage.carousel.summer25.alt',
            captionTitleKey: 'homePage.carousel.summer25.title',
            captionTextKey: 'homePage.carousel.summer25.text',
            linkTo: '/collections/summer-noize-25', // Cần đảm bảo slug này tồn tại hoặc được xử lý đúng
            buttonTextKey: 'homePage.carousel.summer25.button'
        },
        {
            id: 'essentials',
            src: '',
            altKey: 'homePage.carousel.essentials.alt',
            captionTitleKey: 'homePage.carousel.essentials.title',
            captionTextKey: 'homePage.carousel.essentials.text',
            linkTo: '/collections/essentials',
            buttonTextKey: 'homePage.carousel.essentials.button'
        },
    ];

    const translatedSlides = featuredSlidesData.map(slide => ({
        ...slide,
        alt: t(slide.altKey),
        captionTitle: t(slide.captionTitleKey),
        captionText: t(slide.captionTextKey),
        buttonText: t(slide.buttonTextKey),
        // linkTo đã được xử lý trong ImageCarousel component để có prefix ngôn ngữ
    }));

    return (
        <Container fluid className="p-0 my-5 featured-carousel-section">
             <ImageCarousel
                images={translatedSlides} // Truyền slide đã dịch
                slideHeight="80vh"
                objectFit="cover"
                showIndicators={true}
                showControls={true}
                interval={6000}
            />
        </Container>
    );
};


function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="separator-bar bg-dark"></div> {/* Thanh này có thể không cần dịch */}
      <NewProductSection />
      <FeaturedCarouselSection />
    </>
  );
}

export default HomePage;