// src/pages/HomePage.jsx (Trang New Arrivals)
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
// import HeroSection from '../components/home/HeroSection';
// import NewProductSection from '../components/home/NewProductSection';
// import FeaturedSection from '../components/home/FeaturedSection';
// import ProductGrid from '../components/products/ProductGrid'; // Có thể hiển thị 1 vài SP mới
// import { useQuery } from '@apollo/client';
// import { GET_PRODUCTS_QUERY } from '../api/graphql/queries/productQueries'; // Query lấy SP mới

function HomePage() {
  // TODO: Fetch dữ liệu (ảnh hero, ảnh featured, sản phẩm mới...)
  // const { loading, error, data } = useQuery(GET_PRODUCTS_QUERY, {
  //   variables: { filter: { isNewArrival: true }, limit: 8 } // Lấy 8 SP mới nhất
  // });
  // const newProducts = data?.products?.products || [];

  // --- Dữ liệu giả cho Carousel ---
   const featuredImages = [
     { src: 'https://via.placeholder.com/1920x800/000000/FFFFFF?text=Featured+Look+1', alt: 'Featured Look 1' },
     { src: 'https://via.placeholder.com/1920x800/333333/FFFFFF?text=Featured+Look+2', alt: 'Featured Look 2' },
     { src: 'https://via.placeholder.com/1920x800/555555/FFFFFF?text=Featured+Look+3', alt: 'Featured Look 3' },
     { src: 'https://via.placeholder.com/1920x800/777777/FFFFFF?text=Featured+Look+4', alt: 'Featured Look 4' },
   ];
  // -----------------------------

  return (
    <>
      {/* Section 1: Hero (Component riêng hoặc inline) */}
      {/* <HeroSection /> */}
      <div className="hero-section" style={{ height: '100vh', backgroundImage: `url('https://via.placeholder.com/1920x1080/EEEEEE/000000?text=Hero+Background+Image')`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <Container>
            <h1 className="display-1 text-dark">MAKE SOME NOIZE</h1> {/* Font Archivo Black */}
            <p className="lead hero-subtitle">Subheading text here with Cormorant Garamond font.</p>
         </Container>
      </div>


      {/* Section 2: New Products Intro */}
      {/* <NewProductSection /> */}
       <div className="separator-bar bg-dark" style={{ height: '5px', margin: '4rem 0' }}></div> {/* Thanh tách section */}
       <Container className="text-center my-5 py-5">
         <h2 className="mb-4">FRESH DROPS</h2> {/* Font Archivo Black or Oswald */}
         <p className="lead text-muted" style={{maxWidth: '600px', margin: '0 auto'}}> {/* Roboto Mono? */}
            Check out the latest additions to the Noizee collection. Styles that speak louder than words.
         </p>
          {/* Optional: Hiển thị vài sản phẩm mới ở đây */}
          {/* <Row className="mt-5">
               <Col>
                   {loading && <p>Loading products...</p>}
                   {error && <p>Error loading products.</p>}
                   <ProductGrid products={newProducts} />
               </Col>
          </Row> */}
      </Container>


      {/* Section 3: Featured Carousel */}
      {/* <FeaturedSection images={featuredImages} /> */}
      <Container fluid className="p-0 my-5">
         {/* TODO: Implement ImageCarousel component */}
         <div style={{ height: '60vh', backgroundColor: '#ccc', display:'flex', alignItems:'center', justifyContent: 'center' }}>Carousel Placeholder</div>
      </Container>


       {/* Các sections khác nếu cần */}
    </>
  );
}

export default HomePage;