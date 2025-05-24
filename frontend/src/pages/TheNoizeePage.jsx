// src/pages/TheNoizeePage.jsx
import React from 'react';
import { Container, Row, Col, Image, Button } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS_QUERY } from '../api/graphql/queries/productQueries';
import ProductGrid from '../components/product/ProductGrid'; // Đã dịch
import LoadingSpinner from '../components/common/LoadingSpinner'; // Đã dịch
import AlertMessage from '../components/common/AlertMessage'; // Không cần dịch nội bộ
import { useTranslation } from 'react-i18next';
import './TheNoizeePage.css';

// Cân nhắc đặt slug này vào constants hoặc lấy từ API nếu có thể thay đổi
// Hoặc dùng key dịch nếu slug thay đổi theo ngôn ngữ
const THE_NOIZEE_COLLECTION_SLUG_KEY = 'routes.theNoizeeSlug'; // Key dịch cho slug

function TheNoizeePage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const currentLang = params.lang || i18n.language || 'vi';
  
  // Lấy slug từ key dịch, có giá trị mặc định nếu key không tồn tại
  const theNoizeeSlug = t(THE_NOIZEE_COLLECTION_SLUG_KEY, { defaultValue: 'the-noizee' });

  const { loading, error, data } = useQuery(GET_PRODUCTS_QUERY, {
    variables: {
      filter: { collectionSlug: theNoizeeSlug }, // Backend cần hỗ trợ filter theo collectionSlug
      limit: 8,
      offset: 0,
      lang: currentLang // Truyền ngôn ngữ cho query sản phẩm
    },
    fetchPolicy: 'cache-and-network',
  });

  const featuredProducts = data?.products?.products || [];
  
  // Helper để tạo link với prefix ngôn ngữ
  const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');

  return (
    <div className="the-noizee-page">
      <section className="the-noizee-hero text-center text-white">
        <Container>
          <h1 className="hero-title-noizee">{t('theNoizeePage.hero.title')}</h1>
          <p className="hero-subtitle-noizee lead mx-auto">
            {t('theNoizeePage.hero.subtitle')}
          </p>
          {/* Nút CTA có thể được thêm lại nếu cần, đảm bảo link và text được dịch */}
          {/* <Button as={Link} to={langLink(`/collections/${theNoizeeSlug}`)} variant="outline-light" size="lg" className="mt-3">
            {t('theNoizeePage.hero.ctaButton')}
          </Button> */}
        </Container>
      </section>

      <Container className="my-5 py-md-5">
        <Row className="align-items-center">
          <Col md={6} className="mb-4 mb-md-0">
            {/* Sử dụng key dịch cho src nếu ảnh thay đổi theo ngôn ngữ, và cho alt */}
            <Image src={t('theNoizeePage.story.imageUrl')} alt={t('theNoizeePage.story.imageAlt')} fluid rounded className="shadow-lg" />
          </Col>
          <Col md={6} className="ps-md-5">
            <h2 className="section-title-noizee">{t('theNoizeePage.story.title')}</h2>
            <p className="text-muted lh-lg">
              {t('theNoizeePage.story.paragraph1')}
            </p>
            <p className="text-muted lh-lg">
              {t('theNoizeePage.story.paragraph2')}
            </p>
          </Col>
        </Row>
      </Container>

        {featuredProducts.length > 0 && (
            <Container className="my-5 py-md-4 featured-products-noizee">
                <h2 className="section-title-noizee text-center mb-4">{t('theNoizeePage.featuredPieces.title')}</h2>
                {loading && <LoadingSpinner message={t('loadingSpinner.loading')} />}
                {error && <AlertMessage variant="warning">{t('theNoizeePage.featuredPieces.loadError')}</AlertMessage>}
                {!loading && !error && (
                    <ProductGrid products={featuredProducts} itemsPerRow={{ xs: 1, sm: 2, md: 3, lg: 4 }} />
                )}
                <div className="text-center mt-4">
                     <Button as={Link} to={langLink(`/collections/${theNoizeeSlug}`)} variant="dark" size="lg" className="view-all-btn">
                        {t('theNoizeePage.featuredPieces.viewCollectionButton')}
                    </Button>
                </div>
            </Container>
        )}

        <section className="py-5 bg-light">
            <Container>
                <Row>
                    <Col md={7} className="d-flex align-items-center">
                        <div>
                            <h2 className="section-title-noizee">{t('theNoizeePage.behindTheScenes.title')}</h2>
                            <p className="text-muted lead-sm">
                                {t('theNoizeePage.behindTheScenes.description')}
                            </p>
                            <Button variant="outline-dark" as={Link} to={langLink("/lookbook")}>{t('theNoizeePage.behindTheScenes.viewLookbookButton')}</Button>
                        </div>
                    </Col>
                    <Col md={5} className="mt-4 mt-md-0">
                         <Image src={t('theNoizeePage.behindTheScenes.imageUrl')} alt={t('theNoizeePage.behindTheScenes.imageAlt')} fluid rounded />
                    </Col>
                </Row>
            </Container>
        </section>
    </div>
  );
}

export default TheNoizeePage;