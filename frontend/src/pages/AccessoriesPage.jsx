// src/pages/AccessoriesPage.jsx
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
// import ProductGrid from '../components/products/ProductGrid';
// import ProductFilter from '../components/products/ProductFilter';
// import Pagination from '../components/common/Pagination';
// import { useQuery } from '@apollo/client';
// import { GET_PRODUCTS_QUERY } from '../api/graphql/queries/productQueries';
// import useDataTable from '../hooks/useDataTable';

function AccessoriesPage() {
  // TODO: Fetch accessory products (e.g., filter by category 'accessories')
  // const { loading, error, data } = useQuery(GET_PRODUCTS_QUERY, {
  //   variables: { filter: { categoryName: "Accessories" }, limit: 12, offset: 0 } // Giả sử filter theo tên category
  // });
  // const products = data?.products?.products || [];

  return (
    <Container className="my-4 my-md-5">
      <h1 className="page-title mb-4">Accessories</h1> {/* CSS */}

      <Row>
        {/* Optional Filter Column */}
        {/* <Col lg={3} className="mb-4 mb-lg-0">
          <ProductFilter onFilterChange={handleFilterChange} />
        </Col> */}

        {/* Product Grid Column */}
        <Col lg={12}> {/* Hoặc lg={9} nếu có filter */}
           <p className="text-muted">
                Explore our collection of accessories. Design this page according to your needs.
           </p>
          {/* TODO: Hiển thị loading/error/ProductGrid */}
          {/* {loading && <LoadingSpinner />} */}
          {/* {error && <AlertMessage variant="danger">Error loading accessories.</AlertMessage>} */}
          {/* {!loading && !error && <ProductGrid products={products} />} */}
          {/* TODO: Add Pagination */}
        </Col>
      </Row>
    </Container>
  );
}

export default AccessoriesPage;