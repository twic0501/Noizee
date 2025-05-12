// src/pages/TheNoizeePage.jsx
import React from 'react';
import { Container, Row, Col, Image, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS_QUERY } from '../api/graphql/queries/productQueries';
import ProductGrid from '../components/product/ProductGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import './TheNoizeePage.css'; // Tạo file CSS riêng

const THE_NOIZEE_COLLECTION_SLUG_OR_ID = 'the-noizee-collection-slug'; // Thay bằng slug hoặc ID thật

function TheNoizeePage() {
  // Fetch sản phẩm thuộc collection "The Noizee" (ví dụ)
  const { loading, error, data } = useQuery(GET_PRODUCTS_QUERY, {
    variables: {
      filter: { collectionSlug: THE_NOIZEE_COLLECTION_SLUG_OR_ID }, // Giả sử backend hỗ trợ filter theo collectionSlug
      limit: 8, // Giới hạn số sản phẩm hiển thị
      offset: 0
    },
    fetchPolicy: 'cache-and-network',
  });

  const featuredProducts = data?.products?.products || [];

  return (
    <div className="the-noizee-page">
      {/* Section 1: Hero Banner đặc biệt cho "The Noizee" */}
      <section className="the-noizee-hero text-center text-white">
        <Container>
          <h1 className="hero-title-noizee">THE NOIZEE</h1>
          <p className="hero-subtitle-noizee lead mx-auto">
            Where art meets attitude. Discover limited editions and unique collaborations that define the noise.
          </p>
          {/* <Button as={Link} to={`/collections/${THE_NOIZEE_COLLECTION_SLUG_OR_ID}`} variant="outline-light" size="lg" className="mt-3">
            Shop The Collection
          </Button> */}
        </Container>
      </section>

      {/* Section 2: Giới thiệu / Câu chuyện */}
      <Container className="my-5 py-md-5">
        <Row className="align-items-center">
          <Col md={6} className="mb-4 mb-md-0">
            <Image src="/images/the-noizee-story.jpg" alt="The Noizee Story" fluid rounded className="shadow-lg" />
            {/* Thay bằng ảnh thật */}
          </Col>
          <Col md={6} className="ps-md-5">
            <h2 className="section-title-noizee">OUR MANIFESTO</h2>
            <p className="text-muted lh-lg">
              Noizee isn't just a brand; it's a statement. We believe in the power of self-expression,
              the courage to stand out, and the art of disruption. Each piece is crafted not just to be worn,
              but to be a conversation starter, a piece of your identity broadcasted to the world.
            </p>
            <p className="text-muted lh-lg">
              Inspired by the raw energy of the streets, the underground scenes, and the unapologetic spirit of
              those who dare to be different. This is more than fashion. This is The Noizee.
            </p>
          </Col>
        </Row>
      </Container>

        {/* Section 3: Sản phẩm nổi bật từ Collection "The Noizee" */}
        {featuredProducts.length > 0 && (
            <Container className="my-5 py-md-4 featured-products-noizee">
                <h2 className="section-title-noizee text-center mb-4">Featured Pieces</h2>
                {loading && <LoadingSpinner message="Loading featured pieces..." />}
                {error && <AlertMessage variant="warning">Could not load featured pieces.</AlertMessage>}
                {!loading && !error && (
                    <ProductGrid products={featuredProducts} itemsPerRow={{ xs: 1, sm: 2, md: 3, lg: 4 }} />
                )}
                <div className="text-center mt-4">
                     <Button as={Link} to={`/collections/${THE_NOIZEE_COLLECTION_SLUG_OR_ID}`} variant="dark" size="lg" className="view-all-btn">
                        Explore Full Collection
                    </Button>
                </div>
            </Container>
        )}

         {/* Section 4: Behind The Scenes / Lookbook Teaser */}
        <section className="py-5 bg-light">
            <Container>
                <Row>
                    <Col md={7} className="d-flex align-items-center">
                        <div>
                            <h2 className="section-title-noizee">BEHIND THE NOIZE</h2>
                            <p className="text-muted lead-sm">
                                Peek into our creative process, the inspirations, and the artists who make Noizee.
                                Our lookbooks tell a story beyond the fabric.
                            </p>
                            <Button variant="outline-dark" as={Link} to="/lookbook">View Lookbook</Button> {/* Giả sử có trang lookbook */}
                        </div>
                    </Col>
                    <Col md={5} className="mt-4 mt-md-0">
                         <Image src="/images/lookbook-teaser.jpg" alt="Lookbook Teaser" fluid rounded />
                         {/* Thay bằng ảnh thật */}
                    </Col>
                </Row>
            </Container>
        </section>
    </div>
  );
}

export default TheNoizeePage;