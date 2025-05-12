// src/pages/HomePage.jsx
import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS_QUERY } from '../api/graphql/queries/productQueries'; // Query lấy SP
import ProductGrid from '../components/product/ProductGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import ImageCarousel from '../components/product/ImageCarousel'; // Import carousel
import './HomePage.css'; // Tạo file CSS riêng cho HomePage

// Hero Section (Có thể tách ra component riêng: src/components/home/HeroSection.jsx)
const HeroSection = () => (
  <div className="hero-section text-center"> {/* CSS */}
    <Container>
      <h1 className="hero-title">MAKE SOME NOIZE</h1> {/* CSS: Font Archivo Black */}
      <p className="hero-subtitle lead"> {/* CSS: Font Cormorant Garamond */}
        Unleash your unique style. Collections that resonate with the bold and the restless.
      </p>
      <Button as={Link} to="/collections" variant="outline-light" size="lg" className="hero-cta-button mt-3">
        Explore Collections
      </Button>
    </Container>
  </div>
);

// New Products Section (Có thể tách ra component riêng: src/components/home/NewProductSection.jsx)
const NewProductSection = () => {
  const { loading, error, data } = useQuery(GET_PRODUCTS_QUERY, {
    variables: { filter: { isNewArrival: true }, limit: 4, offset: 0 }, // Lấy 4 SP mới nhất
    fetchPolicy: 'cache-and-network',
  });

  const newProducts = data?.products?.products || [];

  return (
    <Container className="text-center my-5 py-4 new-arrivals-section"> {/* CSS */}
      <h2 className="section-title mb-3">FRESH DROPS</h2> {/* CSS */}
      <p className="section-subtitle lead text-muted mx-auto mb-5">
        Check out the latest additions. Styles that speak louder than words.
      </p>
      {loading && <LoadingSpinner message="Loading new arrivals..." />}
      {error && <AlertMessage variant="warning">Could not load new products.</AlertMessage>}
      {!loading && !error && newProducts.length > 0 && (
        <ProductGrid products={newProducts} itemsPerRow={{ xs: 1, sm: 2, md: 4, lg: 4 }} />
      )}
      {!loading && !error && newProducts.length === 0 && (
        <p className="text-muted">No new arrivals at the moment. Check back soon!</p>
      )}
      <Button as={Link} to="/collections?filter=new" variant="dark" size="lg" className="mt-5 view-all-btn"> {/* CSS */}
        View All New Arrivals
      </Button>
    </Container>
  );
};

// Featured Carousel Section (Có thể tách ra component riêng: src/components/home/FeaturedCarouselSection.jsx)
const FeaturedCarouselSection = () => {
    // Dữ liệu này nên được quản lý từ CMS hoặc backend
    const featuredSlides = [
        {
            src: '/images/featured/look1.jpg', // Thay bằng URL ảnh thật (trong public/images hoặc từ CDN)
            alt: 'Featured Collection Summer 2025',
            captionTitle: 'Summer Noize \'25',
            captionText: 'Light fabrics, bold statements. Discover the new wave.',
            linkTo: '/collections/summer-noize-25', // Slug của collection
            buttonText: 'Discover Summer \'25'
        },
        {
            src: '/images/featured/look2.jpg',
            alt: 'Noizee Essentials',
            captionTitle: 'Essentials Redefined',
            captionText: 'Core pieces for your everyday rebellion.',
            linkTo: '/collections/essentials',
            buttonText: 'Shop Essentials'
        },
        // Thêm các slide khác nếu cần
    ];
    return (
        <Container fluid className="p-0 my-5 featured-carousel-section"> {/* CSS */}
             <ImageCarousel
                images={featuredSlides}
                slideHeight="80vh" // Ví dụ chiều cao
                objectFit="cover"
                showIndicators={true}
                showControls={true}
                interval={6000} // Thời gian chuyển slide
            />
        </Container>
    );
};


function HomePage() {
  return (
    <>
      <HeroSection />
      {/* Thanh tách section, có thể là một component riêng hoặc style trực tiếp */}
      <div className="separator-bar bg-dark"></div>
      <NewProductSection />
      <FeaturedCarouselSection />
      {/* Thêm các sections khác nếu cần (ví dụ: Blog posts, Testimonials, Instagram feed) */}
    </>
  );
}

export default HomePage;